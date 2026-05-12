package demo.demo_spring.payment.service;

import demo.demo_spring.cart.domain.CartItem;
import demo.demo_spring.cart.repository.CartItemRepository;
import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.domain.HotDealStatus;
import demo.demo_spring.hotdeal.repository.HotDealRepository;
import demo.demo_spring.hotdeal.service.HotDealRedisStockService;
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

import java.time.*;
import java.util.*;

@Service
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
    private final HotDealRedisStockService hotDealRedisStockService;

    // 결제 준비하기 -> PENDING주문 만들어서 재고 선점과 PortOne에 필요 정보 넘김. 결제를 완료하는게 x.
    @Transactional
    public PaymentPrepareResponse preparePayment(Long memberId, PaymentPrepareRequest request){
        /*
            1. Pending_Payment Orders주문 생성
            2. 주문상품OrderItem 생성
            3. 재고 선점
            4. 결제 준비 상태Payment READY 생성
            5. Port One 결제창에 넘길 값 반환
        */

        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Seoul"));

        Member member = memberService.getMember(memberId);

        if(request.getDeliveryInfo()==null){
            throw new IllegalStateException("배송 정보가 누락되었습니다.");
        }
        DeliveryInfo deliveryInfo = request.getDeliveryInfo().toDeliveryInfo();

        // paymentOrderType별로 주문상품OrderItem 목록 생성
        // -> 주문타입 : 나중에 실패/만료/취소 시, 재고 및 상태 복구를 위해 필요.
        // -> Product/Cart은 DB재고 선점. HotDeal은 Redis 재고 선점.
        boolean hotDealRedisReserved = false;
        Long reservedHotDealId = null;
        Integer reservedQuantity = null;

        try{
            // 주문타입에 맞게 주문상품 상태 체크해서 구매목록 만들기 (createOrderItems -> createOrderTypeOrderItem)
            List<OrderItem> orderItems = createOrderItems(memberId, request);

            // 주문타입 HOTDEAL -> Redis
            if(request.getPaymentOrderType() == PaymentOrderType.HOTDEAL_DIRECT){
                reservedHotDealId = request.getHotDealId();
                reservedQuantity = request.getQuantity();

                // reservedHotDealId -> KEY, reservedQuantity -> ARGV.
                reserveHotDealStockWithRedis(reservedHotDealId, reservedQuantity); //Redis 재고선점
                hotDealRedisReserved = true; // 통과되서 나오면 재고 선점 체크
            }

            // 결제 만료 시간 생성
            LocalDateTime paymentExpiresAt = now.plusMinutes(PAYMENT_EXPIRE_MINUTES); // 현재시간 + 10분

            // PENDING 주문 생성
            // 주문타입 PRODUCT/CART은 DB 재고 선점 처리.
            // HotDeal의 경우, 이중차감 방지를 위해 OrderItem.restoreReservedStock()에서 no-op 처리해둠.
            Orders order = Orders.createPendingPaymentOrder( //결제 대기
                    member, orderItems, deliveryInfo, request.getPaymentMethod(),paymentExpiresAt
            );

            // Orders 저장 -> 이후 재고복구+상태복구를 위해, 결제 기준과 선점한 재고에 대한 정보 저장해두기.
            Orders savedOrder = orderRepository.save(order);

            // paymentId 생성 + READY상태
            String paymentId = createPaymentId();

            Payment payment = Payment.createReadyPayment( //결제 준비
                    savedOrder, paymentId, savedOrder.getTotalPrice(), now
            );

            // 결제 거래 기록Payment 저장 -> 결제 완료 검증을 위한 조회로 사용되어야 함.
            paymentRepository.save(payment);

            String orderName = createOrderName(savedOrder.getOrderItems()); // PortOne 결제창에 표시할 주문명

            // PortOne 결제창에 넘길 PaymentPrepareResponse 만들어 반환 -> 결제 준비 끝.
            return new PaymentPrepareResponse(
                    savedOrder.getId(), paymentId, orderName, savedOrder.getTotalPrice()
            );
        } catch (RuntimeException e){
            if (hotDealRedisReserved) { //Redis 재고 선점 성공 후, 실패 -> Redis 재고 복구
                hotDealRedisStockService.restoreStock(reservedHotDealId, reservedQuantity);
            }
            // false면 선점 전 터진거니 복구 x.

            throw e;
        }
    }
    // PaymentOrderType 판단 후, 맞는 주문상품 생성으로 넘겨주기
    private List<OrderItem> createOrderItems(Long memberId, PaymentPrepareRequest request){
        if(request.getPaymentOrderType() == null){
            throw new IllegalStateException("주문 타입이 누락되었습니다.");
        }

        if(request.getPaymentOrderType() == PaymentOrderType.PRODUCT_DIRECT){
            return createProductDirectOrderItem(request);
        }
        if(request.getPaymentOrderType() == PaymentOrderType.HOTDEAL_DIRECT){
            return createHotDealDirectOrderItem(request);
        }
        if(request.getPaymentOrderType() == PaymentOrderType.CART){
            return createCartOrderItems(memberId, request);
        }

        throw new IllegalStateException("지원하지 않는 주문 타입입니다.");
    }
    // HotDeal Redis 재고 선점
    private void reserveHotDealStockWithRedis(Long hotDealId, Integer quantity){
        if(hotDealId == null){
            throw new IllegalStateException("핫딜 정보가 누락되었습니다.");
        }

        if(quantity == null || quantity < 1){
            throw new IllegalStateException("구매 수량이 잘못되었습니다.");
        }

        boolean success = hotDealRedisStockService.decreaseStock(hotDealId, quantity);

        if(!success){
            throw new IllegalStateException("핫딜 재고가 부족합니다.");
        }
    }
    // HotDeal Redis 재고 복구
    private void restoreRedisHotDealStocks(Orders order){
        for(OrderItem orderItem : order.getOrderItems()){
            if(orderItem.getOrderItemType() == OrderItemType.HOTDEAL){
                hotDealRedisStockService.restoreStock(
                        orderItem.getHotDeal().getId(),
                        orderItem.getQuantity()
                );
            }
        }
    }
    // Product_Direct + 비관적 락 주문상품 생성
    private List<OrderItem> createProductDirectOrderItem(PaymentPrepareRequest request){
        if(request.getProductId() == null){
            throw new IllegalStateException("상품 정보가 누락되었습니다.");
        }
        if(request.getQuantity() == null || request.getQuantity() < 1){
            throw new IllegalStateException("구매 수량이 잘못되었습니다.");
        }

        // 비관적 락으로 원본 상품 존재 체크
        Product product = productRepository.findByIdWithPessimisticLock(request.getProductId())
                .orElseThrow(() -> new IllegalStateException("해당 상품을 찾을 수 없습니다."));
        // 상품 판매 상태 체크
        if(product.getStatus() != ProductStatus.ON_SALE){
            throw new IllegalStateException("판매 중인 상품만 구매할 수 있습니다.");
        }

        return List.of(OrderItem.createProductOrderItem(product, request.getQuantity()));
    }
    // HotDeal_Direct + Redis+lua 주문상품 생성
    private List<OrderItem> createHotDealDirectOrderItem(PaymentPrepareRequest request){
        if(request.getHotDealId() == null){
            throw new IllegalStateException("핫딜 정보가 누락되었습니다.");
        }
        if(request.getQuantity() == null || request.getQuantity() < 1){
            throw new IllegalStateException("구매 수량이 잘못되었습니다.");
        }

        HotDeal hotDeal = hotDealRepository.findById(request.getHotDealId())
                .orElseThrow(() -> new IllegalStateException("해당 핫딜을 찾을 수 없습니다."));

        // 핫딜 상태 체크
        if(hotDeal.getStatus() != HotDealStatus.ON_SALE){
            throw new IllegalStateException("판매 중인 핫딜만 구매할 수 있습니다.");
        }

        return List.of(OrderItem.createHotDealOrderItem(hotDeal, request.getQuantity()));
    }
    // Cart + 비관적 락 주문상품 생성
    private List<OrderItem> createCartOrderItems(Long memberId, PaymentPrepareRequest request){
        if(request.getCartItemIds() == null || request.getCartItemIds().isEmpty()){
            throw new IllegalStateException("장바구니 상품 정보가 누락되었습니다.");
        }

        // 1. 구매 요청받은 cartItem목록을 조회
        List<CartItem> cartItems = new ArrayList<>();

        for(Long cartItemId : request.getCartItemIds()) {
            // memberId로 해당 회원 장바구니에서 선택된 상품만 조회
            CartItem cartItem = cartItemRepository.findByIdAndCartMemberId(cartItemId, memberId)
                    .orElseThrow(() -> new IllegalStateException("장바구니 상품을 찾을 수 없습니다."));

            cartItems.add(cartItem);
        }

        // 2. 받아온 장바구니 상품들에서 productId만 따로 추출하여 목록 만들기 + 데드락 방지
        List<Long> productIds = cartItems.stream()
                .map(cartItem -> cartItem.getProduct().getId())
                .distinct() // 데드락 방지를 위하여
                .sorted() // 중복제거 + 정렬
                .toList();

        // 3. 정렬된 순서대로 Product에 비관적 락 걸어서 가져오기
        Map<Long, Product> lockedProducts = new HashMap<>();

        for(Long productId : productIds){
            Product lockedProduct = productRepository.findByIdWithPessimisticLock(productId)
                    .orElseThrow(()->new IllegalStateException("구매하려는 상품이 없습니다."));
            lockedProducts.put(productId, lockedProduct);
        }

        // 4. 비관적 락 걸린 Product로, 최종적으로 주문서에 넣을 OrderItem주문상품 목록 생성
        List<OrderItem> orderItems = new ArrayList<>();

        for(CartItem cartItem : cartItems){
            Product product = lockedProducts.get(cartItem.getProduct().getId());

            // Product 판매 상태 체크. -> 비공개, 품절 상품 판매x.
            if(product.getStatus() != ProductStatus.ON_SALE){
                throw new IllegalStateException("현재 판매하지 않는 상품이 포함되어 있습니다.");
            }

            // Orders.createPendingPaymentOrder()내부에서 OrderItem.reserveStock()으로 재고 선점함.
            orderItems.add(OrderItem.createProductOrderItem(product, cartItem.getQuantity()));
        }
        // 생성한 카트 주문상품 목록 반환.
        return orderItems;
    }
    // 결제번호 만들기 -> PortOne에 넘길 결제 고유 id.
    private String createPaymentId(){
        return "PAY-" + UUID.randomUUID(); //UUID 랜덤으로 만들기.
    }
    // 주문상품 목록 이용하여, 주문번호 만들기 -> PortOne 결제창에 표시할 주문명
    private String createOrderName(List<OrderItem> orderItems){
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
    @Transactional
    public PaymentCompleteResponse completePayment(Long memberId, PaymentCompleteRequest request){
        /*
            1. 프론트에서 받아온 값 유효성 검사
            2. PortOne 결제 단건 조회
            3. 결제 상태 확인
            4. 결제 금액 == Orders.totalPrice 확인
            5. Orders.markAsPaid() 결제 완료 + 주문 확정 처리.
            6. Payment.markAsPaid() 결제 완료 처리.
        */

        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Seoul"));

        // 1. 프론트로 부터 들어온 결제완료검증 요청값이 유효한지 확인
        // paymentId를 통해 해당 Payment결제 기록에 등록된 Order.getId()와 orderId를 서로 비교하여 유효한 검증 요청 값인지 판단

        if(request.getOrderId() == null){
            throw new IllegalStateException("주문 ID가 누락되었습니다.");
        }
        if(request.getPaymentId() == null || request.getPaymentId().isBlank()){
            throw new IllegalStateException("결제 ID가 누락되었습니다.");
        }

        Payment payment = paymentRepository.findByPaymentId(request.getPaymentId())
                .orElseThrow(() -> new IllegalStateException("결제 정보가 누락되었습니다."));

        Orders order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalStateException("주문 정보를 찾을 수 없습니다."));

        if(!order.getMember().equals(memberService.getMember(memberId))){
            throw new IllegalStateException("본인의 주문만 결제 완료 처리할 수 있습니다.");
        }

        if(!payment.getOrder().getId().equals(order.getId())){
            throw new IllegalStateException("결제 정보와 주문 정보가 일치하지 않습니다.");
        } //통과화면 일치 -> 유효한 값.

        // 2. 백엔드에서 PortOne으로, PortOne이 진행한 결제정보에 대한 조회를 요청보내기 (결제상태, 결제금액 비교를 위해 필요)
        PortOnePaymentResponse portOnePayment = portOneClient.getPayment(request.getPaymentId());

        // 3. 받아온 결제정보portOnePayment에서 결제가 완료PAID인지 확인. 아니면 예외처리.
        if(portOnePayment == null){
            throw new IllegalStateException("PortOne 결제 조회 응답이 비어있습니다.");
        }
        if(!"PAID".equals(portOnePayment.getStatus())){ //PortOne에서 처리된 결제상태가 PAID결제 완료가 아니면
            throw new IllegalStateException("결제가 완료되지 않았습니다.");
        }

        // 4. PortOne에서 결제된 금액과 실제로 결제 요청된 금액이 같은지 비교.
        if(portOnePayment.getAmount() == null){
            throw new IllegalStateException("PortOne 결제 금액 정보가 누락되었습니다.");
        }

        int paidAmount = portOnePayment.getAmount().getTotal(); //PortOne에서 결제된 금액.

        if(!payment.isAmountMatched(paidAmount)){
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
    @Transactional
    public PaymentCancelResponse cancelPayment(Long memberId, PaymentCancelRequest request){
        /*
            1. PortOne 결제 취소 API 호출
            2. Orders.cancel(now)
            3. Payment.cancel()
            4. 재고 복구
            5. 구매수 감소
        */

        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Seoul"));

        if(request.getOrderId() == null){
            throw new IllegalStateException("주문 ID가 누락되었습니다.");
        }

        Orders order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalStateException("주문 정보를 찾을 수 없습니다."));

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

        // HotDeal -> Redis 재고 복구. Product/Cart 통과해도됨. 안에서 타입으로 막고있음.
        restoreRedisHotDealStocks(order);

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
    @Transactional
    public void expirePendingPayments(){
        /*
            1. 만료된 PENDING_PAYMENT 주문 조회
            2. 주문 만료 처리. Orders.expirePayment(now) -> 선점 재고 복구 + 상태 복구
            3. 결제 만료 처리. Payment.expire()
        */

        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Seoul"));

        // 만료된 Pending주문들 찾아오기
        List<Orders> expiredOrders =
                orderRepository.findByOrderStatusAndPaymentExpiresAtLessThanEqual(
                        OrderStatus.PENDING_PAYMENT, now
                );

        // 각각 for문 돌면서 주문상태, 결제상태 설정.
        for(Orders order : expiredOrders){
            Payment payment = paymentRepository.findByOrderId(order.getId())
                    .orElseThrow(() -> new IllegalStateException("결제 정보를 찾을 수 없습니다."));

            //HotDeal -> Redis로 재고 복구
            restoreRedisHotDealStocks(order);

            //Product + Cart는 DB에서 재고 선점
            // HotDeal은 OrderItem.restoreReservedStock()에서 no-op해둠.
            order.expirePayment(now); //주문상태 : PENDING_PAYMENT(결제대기) -> EXPIRED(만료). 선점해둔 재고 복구 + 상태 복구
            payment.expire(now); //결제상태 : READY(결제준비) -> EXPIRED(만료).
        }

    }
}

/*
< 전체 구매 흐름 >

    HOTDEAL_DIRECT
        -> HotDeal 조회
        -> Redis Lua로 재고 선점
        -> OrderItem 생성
        -> Orders 생성
        -> Payment READY 생성

    PRODUCT_DIRECT
        -> Product 비관적 락 조회
        -> OrderItem 생성
        -> Orders.createPendingPaymentOrder()
        -> Product 재고 차감
        -> Payment READY 생성

    CART
        -> CartItem 조회
        -> Product id 정렬
        -> Product 비관적 락 조회
        -> OrderItem 생성
        -> Orders.createPendingPaymentOrder()
        -> Product 재고 차감
        -> Payment READY 생성
 */