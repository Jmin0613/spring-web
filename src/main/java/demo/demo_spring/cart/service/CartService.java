package demo.demo_spring.cart.service;

import demo.demo_spring.cart.domain.Cart;
import demo.demo_spring.cart.domain.CartItem;
import demo.demo_spring.cart.dto.*;
import demo.demo_spring.cart.repository.CartItemRepository;
import demo.demo_spring.cart.repository.CartRepository;
import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.order.domain.DeliveryInfo;
import demo.demo_spring.order.domain.OrderItem;
import demo.demo_spring.order.dto.DeliveryInfoRequest;
import demo.demo_spring.order.service.OrderService;
import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.domain.ProductStatus;
import demo.demo_spring.product.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class CartService {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final MemberService memberService;
    private final ProductRepository productRepository;
    private final OrderService orderService;

    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository,
                       MemberService memberService, ProductRepository productRepository, OrderService orderService) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.memberService = memberService;
        this.productRepository = productRepository;
        this.orderService = orderService;
    }

    // 장바구니 담기
    public Long create(Long productId, Long memberId, String guestToken,
                       CartItemCreateRequest request) {
        // 장바구니 담을 해당 product 조회
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalStateException("장바구니에 담으시려는 상품이 없습니다."));

        // 카트 조회하거나 새로 만들어오기
        Cart cart = getOrCreateCart(memberId, guestToken);

        // 요청 수량 null 체크
        int quantity = request.getQuantity();
        if (quantity < 1) {
            throw new IllegalStateException("장바구니 수량은 1개 이상이어야 합니다.");
        }

        // cart안에 같은 cartItem이 있는지 찾기
        Optional<CartItem> foundCartItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId);

        if(foundCartItem.isPresent()){
            CartItem existingCartItem = foundCartItem.get();
            existingCartItem.addQuantity(quantity);
            return existingCartItem.getId();
        }

        // 없으면 새로 cartItem 생성 후, cart에 연결, 저장
        CartItem cartItem = CartItem.createCartItem(product, request.getQuantity());
        cart.addCartItem(cartItem);

        CartItem savedCartItem = cartItemRepository.save(cartItem);
        return savedCartItem.getId();

    }

    // 장바구니 조회
    public CartResponse findCartItems(Long memberId, String guestToken) {
        // 담아올 Cart 객체 Optional로 생성
        Optional<Cart> foundCart;

        // member 조회
        if(memberId != null){ // 회원일 경우
            memberService.getMember(memberId); //memberId넣어서 member 존재 체크
            foundCart = cartRepository.findByMemberId(memberId); //해당 member의 cart 꺼내오기
        } else{ // 비회워일 경우
            if(guestToken == null || guestToken.isBlank()){ //만약 토큰이 비어있다면
                return CartResponse.empty(); //빈 카트 반환
            }
            foundCart = cartRepository.findByGuestToken(guestToken); //토큰이 있다면, 해당 토큰의 cart 꺼내오기
        }

        // 만약 꺼내온 cart들이 비어있을 경우 빈 칸트 반환
        if(foundCart.isEmpty()){
            return CartResponse.empty();
        }

        // 받아온 foundCart를 Optional에서 꺼내기
        Cart cart = foundCart.get();
        // 장바구니 summary 생성
        CartSummaryResponse summary = CartSummaryResponse.fromEntity(cart);

        // 찾아온 cart 반환
        return CartResponse.of(cart, summary);
    }

    // 장바구니 수량 변경
    public void update(Long cartItemId, Long memberId, String guestToken,
                       CartItemUpdateRequest request) {
        // 본인 cartItem인지 확인 + 조회
        CartItem cartItem = getOwnedCartItem(cartItemId, memberId, guestToken);

        // 요청 수량 null 체크
        int quantity = request.getQuantity();
        if (quantity < 1) {
            throw new IllegalStateException("장바구니 수량은 1개 이상이어야 합니다.");
        }

        // 수량 변경
        cartItem.changeQuantity(request.getQuantity());

    }

    // 장바구니 삭제
    public void delete(Long cartItemId, Long memberId, String guestToken) {
        // 본인 cartItem인지 확인 + 조회
        CartItem cartItem = getOwnedCartItem(cartItemId, memberId, guestToken);

        // 삭제
        cartItemRepository.delete(cartItem);
    }

    // 장바구니 전체 삭제
    public void deleteAll(Long memberId, String guestToken){
        // 담아올 Cart 객체 Optional로 생성
        Optional<Cart> foundCart;

        if(memberId != null){  //회원인 경우
            foundCart = cartRepository.findByMemberId(memberId); //memberId로 꺼내오기
        } else{ // 비회원인 경우
            if(guestToken == null || guestToken.isBlank()){ //토큰이 비어있으면
                return; //지울거 없으니 그대로 반환
            }
            foundCart = cartRepository.findByGuestToken(guestToken); //토큰이있으면 해당 token으로 꺼내오기
        }

        //꺼내온 cart가 비어있으면
        if(foundCart.isEmpty()){
            return; //그대로 return.
        }

        // 꺼내온 cart값을 Optional에서 꺼내기
        Cart cart = foundCart.get();

        // 삭제
        cartItemRepository.deleteAllByCartId(cart.getId());
        // cartItem.isEmpty()안하고, 그냥 0건 삭제하고 보내기.
    }

    // 장바구니 선택상태 변경
    public void changeCartItemSelection(Long cartItemId, Long memberId, String guestToken,
                                        CartItemSelectionRequest request) {
        // 본인 cartItem인지 확인 + 조회
        CartItem cartItem = getOwnedCartItem(cartItemId, memberId, guestToken);

        // 선택 상태 변경
        cartItem.changeSelected(request.isSelected());
    }

    // 장바구니 구매
    public Long buyCart(Long memberId, CartBuyRequest request){
        // 장바구니 항목들 검증 -> 거기서 상품id만 뽑기
        // -> 상품 id 정렬 -> 정렬된 순서대로 비관적 락 걸어서 Product 다시 조회
        // -> 그 락 걸린 Product로 재고 차감 -> 주문 생성

        // 구매할 멤버 조회
        Member member = memberService.getMember(memberId);

        // 해당 회원의 장바구니에서 선택된 상품만 조회
        List<CartItem> cartItems = cartItemRepository.findByCartMemberIdAndSelectedTrue(memberId);

        // 장바구니 선택 상품들 잘 들어왔나 체크 -> null은 dto에서 검증
        if(cartItems.isEmpty()){ // 빈 리스트일 수 있으니 체크
            throw new IllegalStateException("구매할 장바구니 항목을 선택해주세요.");
        }

        // 받아온 장바구니 상품들에서 productId만 따로 추출
        // 추출하는 이유 -> 비관적 락은 CartItem이 아닌, Product에 걸어야 하기 떄문.
        List<Long> productIds = cartItems.stream()
                .map(cartItem -> cartItem.getProduct().getId())
                .distinct() // 혹시 모르니 중복제거
                .sorted() // 정렬 -> 데드락으로부터 보호
                .toList();

        Map<Long, Product> lockedProducts = new HashMap<>(); //락 걸어서 다시 조회한 Product들을 담아둘 맵
        // cartItem마다 다시 db 조회안하고 이미 락 잡은거 바로 꺼내쓰기위해

        // 정렬된 순서대로 Product에 비관적 락 걸어 가져오기
        for(Long productId : productIds){
            Product lockedProduct = productRepository.findByIdWithPessimisticLock(productId)
                    .orElseThrow(()->new IllegalStateException("구매하려는 상품이 없습니다."));
            lockedProducts.put(productId, lockedProduct);
        }

        // 최종적으로 주문서에 넣을 주문상품 목록
        List<OrderItem> orderItems = new ArrayList<>();

        // 주문상품 목록 채우기
        for(CartItem cartItem : cartItems){
            Product product = lockedProducts.get(cartItem.getProduct().getId()); //락 걸린거 꺼내기
            // cartItem에서 product id만 참고하고, 실제 재고 차감은 락 걸린 lockedProduct로 진행.

            if(product.getStatus() == ProductStatus.HIDDEN || product.getStatus() == ProductStatus.SOLD_OUT){
                throw new IllegalStateException("현재 판매하지 않는 상품이 포함되어 있습니다."); // 비공개, 품절 상품 포함 체크
            }

            // 락 걸린 product 상품 재고 차감
            product.buy(cartItem.getQuantity()); // 이제 같은 상품 row에 비관적 락 걸려있음

            // 장바구니 항목 하나를 주문상품 하나로 바꾸기
            OrderItem orderItem = OrderItem.createOrderItem(
                    product, cartItem.getQuantity(), product.getPrice()
            );

            // 주문 상품 리스트에 추가
            orderItems.add(orderItem);
        }
        DeliveryInfo deliveryInfo = toDeliveryInfo(request.getDeliveryInfo());
        Long orderId = orderService.create(member, orderItems, deliveryInfo); // 주문상품 리스트로 실제 주문서 생성

        cartItemRepository.deleteAll(cartItems); // 구매한 상품 장바구니에서 삭제

        return orderId; // 주문 번호
    }
    // 배송 정보
    private DeliveryInfo toDeliveryInfo(DeliveryInfoRequest request){
        return new DeliveryInfo(
                request.getReceiverName(), request.getPhoneNumber(), request.getAddress(), request.getDeliveryMemo()
        );
    }



    /* 헬퍼 메서드 */

    // Cart 조회 또는 생성 메서드 -> 있으면 꺼내기, 없으면 만들어 보내기
    private Cart getOrCreateCart(Long memberId, String guestToken) {
        // 회원 장바구니 조회
        if(memberId != null){
            Member member = memberService.getMember(memberId);

            return cartRepository.findByMemberId(memberId) //있으면 꺼내기
                    .orElseGet(()-> cartRepository.save(Cart.createMemberCart(member))); // 없으면 만들기
        }

        // 비회원 토큰 존재 체크
        if(guestToken == null || guestToken.isBlank()){
            throw new IllegalStateException("비회원 장바구니 토큰이 없습니다.");
        }

        // 통과 -> 토큰 존재 O. 비회원 장바구니 조회.
        return cartRepository.findByGuestToken(guestToken) //있으면 꺼내기
                .orElseGet(() -> cartRepository.save(Cart.createGuestCart(guestToken))); //없으면 만들기
    }

    // 본인 cartItem 찾기 (cartItem이 있는지 + 그게 본인 cart에 속하는지)
    private CartItem getOwnedCartItem(Long cartItemId, Long memberId, String guestToken){
        // 회원일 경우
        if(memberId != null){
            return cartItemRepository.findByIdAndCartMemberId(cartItemId, memberId)
                    .orElseThrow(() -> new IllegalStateException("장바구니 상품이 없습니다."));
        }

        // 비회원일 경우
        if(guestToken == null || guestToken.isBlank()){
            throw new IllegalStateException("비회원 장바구니 토큰이 없습니다.");
        }
        return cartItemRepository.findByIdAndCartGuestToken(cartItemId, guestToken)
                .orElseThrow(() -> new IllegalStateException("장바구니 상품이 없습니다."));
    }

    // 회원카트 -> 비회원 임시 카트 -> 로그인 시 병합. 확장 생각해보기
}
