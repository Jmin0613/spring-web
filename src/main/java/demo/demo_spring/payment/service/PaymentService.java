package demo.demo_spring.payment.service;

import demo.demo_spring.cart.domain.CartItem;
import demo.demo_spring.cart.repository.CartItemRepository;
import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.repository.HotDealRepository;
import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.order.domain.*;
import demo.demo_spring.order.repository.OrderRepository;
import demo.demo_spring.payment.domain.Payment;
import demo.demo_spring.payment.domain.PaymentOrderType;
import demo.demo_spring.payment.domain.PaymentStatus;
import demo.demo_spring.payment.dto.*;
import demo.demo_spring.payment.portone.PortOneClient;
import demo.demo_spring.payment.portone.dto.PortOnePaymentResponse;
import demo.demo_spring.payment.repository.PaymentRepository;
import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.domain.ProductStatus;
import demo.demo_spring.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class PaymentService {

    private static final int PAYMENT_EXPIRE_MINUTES = 10; //결제 만료 시간

    private final MemberService memberService;
    private final ProductRepository productRepository;
    private final HotDealRepository hotDealRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final CartItemRepository cartItemRepository;
    private final PortOneClient portOneClient;

    // 결제 준비하기 -> PENDING주문 만들어서 재고 선점고 PortOne에 필요 정보 넘김. 결제를 완료하는게 x.
    public PaymentPrepareResponse preparePayment(Long memberId, PaymentPrepareRequest request){
        /* 1. Pending_Payment Orders주문 생성
           2. 주문상품OrderItem 생성
           3. 재고 선점
           4. 결제 준비 상태Payment READY 생성
           5. Port One 결제창에 넘길 값 반환 */

        LocalDateTime now = LocalDateTime.now();

        //1. 주문한 회원 조회
        Member member = memberService.getMember(memberId);

        //2. 배송정보 생성
        if(request.getDeliveryInfo()==null){
            throw new IllegalStateException("배송 정보가 누락되었습니다.");
        }
        DeliveryInfo deliveryInfo = request.getDeliveryInfo().toDeliveryInfo();

        //3. paymentOrderType별로 주문상품OrderItem 목록 생성
        // -> 주문타입 : 나중에 실패/만료/취소 시, 재고 및 상태 복구를 위해 필요.
        List<OrderItem> orderItems = createOrderItems(memberId, request);

        //4. 결제 만료 시간 생성
        LocalDateTime paymentExpiresAt = now.plusMinutes(PAYMENT_EXPIRE_MINUTES); // 현재시간 + 10분

        //5. PENDING 주문 생성
        Orders order = Orders.createPendingPaymentOrder( //결제 대기
                member, orderItems, deliveryInfo, request.getPaymentMethod(),paymentExpiresAt
                // 여기서 재고 선점됨
        );

        //6. Orders 저장 -> 이후 재고복구+상태복구를 위해, 결제 기준과 선점한 재고에 대한 정보 저장해두기.
        Orders savedOrder = orderRepository.save(order);

        //7. paymentId 생성
        String paymentId = createPaymentId();

        //8. Payment.createReadyPayment()
        Payment payment = Payment.createReadyPayment( //결제 준비
                savedOrder, paymentId, savedOrder.getTotalPrice(), now
        );

        //10. 결제 거래 기록Payment 저장 -> 결제 완료 검증을 위한 조회로 사용되어야 함.
        paymentRepository.save(payment);

        //11. orderName 생성
        String orderName = createOrderName(savedOrder.getOrderItems()); // PortOne 결제창에 표시할 주문명

        //12. PaymentPrepareResponse 만들어 반환 -> 결제 준비 끝.
        return new PaymentPrepareResponse(
                savedOrder.getId(), paymentId, orderName, savedOrder.getTotalPrice()
        );

    }
    // PaymentOrderType별로 주문상품 생성 나눠주기
    private List<OrderItem> createOrderItems(Long memberId, PaymentPrepareRequest request){
        if(request.getPaymentOrderType() == null){
            throw new IllegalStateException("주문 타입이 누락되었습니다.");
        }

        // PRODUCT_DIRECT면 Product 조회 후 createProductOrderItem()
        if(request.getPaymentOrderType() == PaymentOrderType.PRODUCT_DIRECT){
            return createProductDirectOrderItem(request);
        }
        // HOTDEAL_DIRECT면 HotDeal 조회 후 createHotDealOrderItem()
        if(request.getPaymentOrderType() == PaymentOrderType.HOTDEAL_DIRECT){
            return createHotDealDirectOrderItem(request);
        }
        // CART면 선택된 CartItem들로 OrderItem 생성
        if(request.getPaymentOrderType() == PaymentOrderType.CART){
            return createCartOrderItems(memberId, request);
        }

        throw new IllegalStateException("지원하지 않는 주문 타입입니다.");
    }
    // Product_Direct 주문상품 생성
    private List<OrderItem> createProductDirectOrderItem(PaymentPrepareRequest request){
        // 상품 존재 검증 + 수량 검증
        if(request.getProductId() == null){
            throw new IllegalStateException("상품 정보가 누락되었습니다.");
        }
        if(request.getQuantity() == null || request.getQuantity() < 1){
            throw new IllegalStateException("구매 수량이 잘못되었습니다.");
        }

        // 원본 상품 존재 체크
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalStateException("해당 상품을 찾을 수 없습니다."));
        // 상품 판매 상태 체크
        if(product.getStatus() != ProductStatus.ON_SALE){
            throw new IllegalStateException("판매 중인 상품만 구매할 수 있습니다.");
        }

        return List.of(OrderItem.createProductOrderItem(product, request.getQuantity()));
    }
    // HotDeal_Direct 주문상품 생성
    private List<OrderItem> createHotDealDirectOrderItem(PaymentPrepareRequest request){
        // 상품 존재 검증 + 수량 검증
        if(request.getHotDealId() == null){
            throw new IllegalStateException("핫딜 정보가 누락되었습니다.");
        }
        if(request.getQuantity() == null || request.getQuantity() < 1){
            throw new IllegalStateException("구매 수량이 잘못되었습니다.");
        }

        // 핫딜 상품 존재 체크
        HotDeal hotDeal = hotDealRepository.findById(request.getHotDealId())
                .orElseThrow(() -> new IllegalStateException("해당 핫딜을 찾을 수 없습니다."));

        return List.of(OrderItem.createHotDealOrderItem(hotDeal, request.getQuantity()));
    }
    // Cart 주문상품 생성
    private List<OrderItem> createCartOrderItems(Long memberId, PaymentPrepareRequest request){
        // z카트 및 상품 존재 검증
        if(request.getCartItemIds() == null || request.getCartItemIds().isEmpty()){
            throw new IllegalStateException("장바구니 상품 정보가 누락되었습니다.");
        }

        // 주문상품 넣을 빈 목록 생성
        List<OrderItem> orderItems = new ArrayList<>();

        // 주문상품 목록에 채워넣기
        for(Long cartItemId : request.getCartItemIds()){
            // 카트에 든 주문상품 꺼내기
            CartItem cartItem = cartItemRepository.findByIdAndCartMemberId(cartItemId, memberId)
                    .orElseThrow(() -> new IllegalStateException("장바구니 상품을 찾을 수 없습니다."));

            // 원본 상품 판매 가능 상태 체크
            Product product = cartItem.getProduct();
            if(product.getStatus() != ProductStatus.ON_SALE){
                throw new IllegalStateException("판매 중인 상품만 구매할 수 있습니다.");
            }

            // 장바구니에 들어가는 상품은 모두 Product이므로 Product 구매로 연결
            orderItems.add(OrderItem.createProductOrderItem(product, cartItem.getQuantity()));
        }
        return orderItems;
    }
    // 결제번호 만들기 -> PortOne에 넘길 결제 고유 id.
    private String createPaymentId(){
        return "PAY-" + UUID.randomUUID(); //UUID 랜덤으로 만들기.
    }
    // 주문상품 목록 이용하여, 주문번호 만들기 -> PortOne 결제창에 표시할 주문명
    private String createOrderName(List<OrderItem> orderItems){
        // 목록에 상품 들어가 있는지 체크
        if(orderItems == null || orderItems.isEmpty()){
            throw new IllegalStateException("주문 상품 정보가 누락되었습니다.");
        }

        String firstProductName = orderItems.getFirst().getProductNameSnapshot();

        if(orderItems.size() == 1){
            return firstProductName;
        }

        return firstProductName + " 외 " + (orderItems.size() - 1) + "건";
    }

    // 결제 완료하기 -> PortOne 결제 후, 프론트에서 백엔드로 결제완료 검증 요청
    public PaymentCompleteResponse completePayment(Long memberId, PaymentCompleteRequest request){
        /*  1. 프론트에서 받아온 값 유효성 검사
            2. PortOne 결제 단건 조회
            3. 결제 상태 확인
            4. 결제 금액 == Orders.totalPrice 확인
            5. Orders.markAsPaid() 결제 완료 + 주문 확정 처리.
            6. Payment.markAsPaid() 결제 완료 처리. */

        LocalDateTime now = LocalDateTime.now();

        // 1. 프론트로 부터 들어온 결제완료검증 요청값이 유효한지 확인
        // paymentId를 통해 해당 Payment결제 기록에 등록된 Order.getId()와 orderId를 서로 비교하여
        // 유효한 검증 요청 값인지 판단

        // request에 비교에 사용할 orderId와 paymentId가 제대로 들어왔는지 확인
        if(request.getOrderId() == null){
            throw new IllegalStateException("주문 ID가 누락되었습니다.");
        }
        if(request.getPaymentId() == null || request.getPaymentId().isBlank()){
            throw new IllegalStateException("결제 ID가 누락되었습니다.");
        }

        // 유효한 paymentId, orderId인지 확인
        Payment payment = paymentRepository.findByPaymentId(request.getPaymentId())
                .orElseThrow(() -> new IllegalStateException("결제 정보가 누락되었습니다."));

        Orders order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalStateException("주문 정보를 찾을 수 없습니다."));
        // 해당 Order가 현재 로그인한 회원의 주문인지 확인
        if(!order.getMember().equals(memberService.getMember(memberId))){
            throw new IllegalStateException("본인의 주문만 결제 완료 처리할 수 있습니다.");
        }

        // payment결제 기록에 들어있는 Order.getId()와, request에서 받아온 OrderId를 비교.
        if(!payment.getOrder().getId().equals(order.getId())){
            throw new IllegalStateException("결제 정보와 주문 정보가 일치하지 않습니다.");
        } //통과화면 일치 -> 유효한 값.

        // 2. 백엔드에서 PortOne으로,
        // PortOne이 진행한 결제정보에 대한 조회를 요청보내기 (결제상태, 결제금액 비교를 위해 필요)
        PortOnePaymentResponse portOnePayment = portOneClient.getPayment(request.getPaymentId());

        // 3. 받아온 결제정보portOnePayment에서 결제가 완료PAID인지 확인. 아니면 예외처리.
        if(portOnePayment == null){ //비어있으면 예외
            throw new IllegalStateException("PortOne 결제 조회 응답이 비어있습니다.");
        }
        if(!"PAID".equals(portOnePayment.getStatus())){ //PortOne에서 처리된 결제상태가 PAID결제 완료가 아니면
            throw new IllegalStateException("결제가 완료되지 않았습니다.");
        }

        // 4. PortOne에서 결제된 금액과 실제로 결제 요청된 금액이 같은지 비교.
        if(portOnePayment.getAmount() == null){ // 결제 정보가 비어있으면,
            throw new IllegalStateException("PortOne 결제 금액 정보가 누락되었습니다.");
        }

        int paidAmount = portOnePayment.getAmount().getTotal(); //PortOne에서 결제된 금액.

        if(!payment.isAmountMatched(paidAmount)){ // 금액 비교
            throw new IllegalStateException("결제 금액이 일치하지 않습니다.");
        }

        // 통과하면, PAID + Amount일치
        order.markAsPaid(now); //결제 완료 + 주문 확정.
        payment.markAsPaid(now); // 결제 완료.
        return new PaymentCompleteResponse(order.getId());
        //주문 완료된 orderId를 프론트에 응답으로 반환. 프론트에선 이걸로 주문 상세 페이지 이동.

        // 통과하지못한 결제 실패, 주문 만료에 대한 재고/상태 복구는 스케쥴러로 처리.
    }

    // 결제 취소하기
    public PaymentCancelResponse cancelPayment(Long memberId, PaymentCancelRequest request){
        /*  1. PortOne 결제 취소 API 호출
            2. Orders.cancel(now)
            3. Payment.cancel()
            4. 재고 복구
            5. 구매수 감소 */

        LocalDateTime now = LocalDateTime.now();

        // 결제 취소 요청request 들어온 orderId결제번호 확인
        if(request.getOrderId() == null){
            throw new IllegalStateException("주문 ID가 누락되었습니다.");
        }

        // orderId로 취소할 Order주문 가져오기
        Orders order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalStateException("주문 정보를 찾을 수 없습니다."));

        // 결제를 요청하는 회원이 구매회원이 맞는지 비교
        if(!order.getMember().getId().equals(memberId)){
            throw new IllegalStateException("본인의 주문만 취소할 수 있습니다.");
        }

        // 취소할 payment결제 기록 가져오기.
        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new IllegalStateException("결제 정보를 찾을 수 없습니다."));

        // 결제 취소 사유
        String reason = request.getReason();
        if(reason == null || reason.isBlank()){
            reason = "사용자 요청 취소";
        }

        // DB에서 주문, 결제 완료 맞는지 상태 검증
        validateCancelableOrder(order, payment);

        // 통과하면 PortOne 결제 취소 요청
        portOneClient.cancelPayment(payment.getPaymentId(), reason);
        // DB 상태 변경
        order.cancel(now);
        payment.cancel(reason, now);

        return new PaymentCancelResponse(order.getId());
    }
    // 취소 요청 주문, 결제 상태 검증
    private void validateCancelableOrder(Orders order, Payment payment){
        if(order.getOrderStatus() != OrderStatus.PAID) {
            throw new IllegalStateException("결제 완료 주문만 취소할 수 있습니다.");
        }

        if(order.getDeliveryStatus() != DeliveryStatus.READY){
            throw new IllegalStateException("배송 시작 이후에는 주문을 취소할 수 없습니다.");
        }

        if(payment.getStatus() != PaymentStatus.PAID){
            throw new IllegalStateException("결제 완료 건만 취소할 수 있습니다.");
        }
    }

    // 결제 시간 만료된 주문에 대해 재고+상태 복구 처리
    public void expirePendingPayments(){
        /*  1. 만료된 PENDING_PAYMENT 주문 조회
            2. 주문 만료 처리. Orders.expirePayment(now) -> 선점 재고 복구 + 상태 복구
            3. 결제 만료 처리. Payment.expire() */

        LocalDateTime now = LocalDateTime.now();

        // 만료된 Pending주문들 찾아오기
        List<Orders> expiredOrders =
                orderRepository.findByOrderStatusAndPaymentExpiresAtLessThanEqual(
                        OrderStatus.PENDING_PAYMENT, now
                );

        // 각각 for문 돌면서, 주문상태, 결제상태 설정.
        for(Orders order : expiredOrders){
            Payment payment = paymentRepository.findByOrderId(order.getId())
                    .orElseThrow(() -> new IllegalStateException("결제 정보를 찾을 수 없습니다."));

            order.expirePayment(now); //주문상태 : PENDING_PAYMENT(결제대기) -> EXPIRED(만료). 선점해둔 재고 복구 + 상태 복구
            payment.expire(now); //결제상태 : READY(결제준비) -> EXPIRED(만료).
        }

    }
}
