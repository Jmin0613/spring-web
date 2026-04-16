package demo.demo_spring.cart.service;

import demo.demo_spring.cart.domain.Cart;
import demo.demo_spring.cart.domain.CartItem;
import demo.demo_spring.cart.dto.*;
import demo.demo_spring.cart.repository.CartItemRepository;
import demo.demo_spring.cart.repository.CartRepository;
import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.order.domain.OrderItem;
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
    public Long create(Long productId, Long memberId, CartItemCreateRequest request) {
        // 1. member회원과 product상품을 찾는다 -> member 및 product 조회
        Member member = memberService.getMember(memberId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalStateException("장바구니에 담으시려는 상품이 없습니다."));

        // 2. 요청 수량 null 체크
        Integer quantity = request.getQuantity();
        if (quantity == null) {
            throw new IllegalStateException("장바구니 수량을 입력해주세요.");
        }

        // 3. 회원의 cart를 찾는다. 없으면 만든다.
        Cart cart = getOrCreateCart(member); // 진짜 Cart가 아닌, 응답용

        // 4. 그 cart안에 같은 cartItem이 있는지 찾는다.
        Optional<CartItem> foundCartItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId);

        if (foundCartItem.isPresent()) { // 있으면 그 cartItem 객체를 꺼내서 수량 증가
            CartItem existingCartItem = foundCartItem.get(); // Optional꺼내서 저장하기
            existingCartItem.addQuantity(quantity); // 기존꺼에 수량 더하기
            return existingCartItem.getId();
        } else { // 없으면 새 cartItem 생성 후 cart에 연결하고 저장
            CartItem cartItem = CartItem.createCartItem(product, quantity); // 새로운 객체 생성
            cart.addCartItem(cartItem); // cart에 cartItem 연결
            CartItem savedCartItem = cartItemRepository.save(cartItem);
            return savedCartItem.getId();
        }

    }

    // 장바구니 수량 변경
    public void update(Long cartItemId, Long memberId, CartItemUpdateRequest request) {
        // 1. 로그인 member 조회
        memberService.getMember(memberId);
        // 2. cartItem 조회
        CartItem cartItem = getCartItemOrThrow(cartItemId);

        // 3. 그 cartItem이 로그인 회원의 cart 소속인지 확인
        validateCartItemOwner(cartItem, memberId);

        // 4. 요청 수량 null 체크
        Integer quantity = request.getQuantity();
        if (quantity == null) {
            throw new IllegalStateException("장바구니 수량을 입력해주세요.");
        }

        // 5. 통과하면 수량 변경
        cartItem.changeQuantity(quantity);
    }

    // 장바구니 삭제
    public void delete(Long cartItemId, Long memberId) {
        // 1. 로그인 member 조회
        memberService.getMember(memberId);
        // 2. cartItem 조회
        CartItem cartItem = getCartItemOrThrow(cartItemId);

        // 3. 그 cartItem이 로그인 회원의 cart 소속인지 확인
        validateCartItemOwner(cartItem, memberId);

        // 4. 맞으면 삭제
        cartItemRepository.delete(cartItem);
    }

    // 장바구니 전체 삭제
    public void deleteAll(Long memberId){
        // 로그인 member 조회
        System.out.println("멤버 조회");
        memberService.getMember(memberId);

        // 해당 member의 카트 꺼내오기
        Optional<Cart> foundCart = cartRepository.findByMemberId(memberId);
        // 장바구니 자체가 있는지 확인
        if(foundCart.isEmpty()){
            return;
        }

        // Optional에서 꺼내기
        Cart cart = foundCart.get();
        // 장바구니 안이 비어있나 확인
        if(cart.getCartItems().isEmpty()){
            return;
        }

        cartItemRepository.deleteAllByCartId(cart.getId());
//        int deletedCount = cartItemRepository.deleteAllByCartId(cart.getId());
//        System.out.println("삭제된 cartItem 개수 = " + deletedCount);
    }

    // 장바구니 조회
    public CartResponse findCartItems(Long memberId) {
        // member 조회
        memberService.getMember(memberId);

        // cart 조회
        Optional<Cart> foundCart = cartRepository.findByMemberId(memberId); // memberId로 cart 조회

        if (foundCart.isEmpty()) { // cart 없으면 DTO에서 빈 리스트 만들어 반환
            return CartResponse.empty(); //서비스 로직 깔끔하게 DTO에서 빈 리스트 생성
        }

        // cart 있으면 cartItem 목록 조회
        Cart cart = foundCart.get();
        return CartResponse.fromEntity(cart);
    }

    // 장바구니 구매
    public Long buyCart(Long memberId, CartBuyRequest request){
        // 장바구니 항목들 검증 -> 거기서 상품id만 뽑기
        // -> 상품 id 정렬 -> 정렬된 순서대로 비관적 락 걸어서 Product 다시 조회
        // -> 그 락 걸린 Product로 재고 차감 -> 주문 생성

        // 구매할 멤버 조회 + 장바구니 선택 항목(id 목록) 꺼내기
        Member member = memberService.getMember(memberId);
        List<Long> cartItemIds = request.getCartItemIds();

        // 장바구니 선택 항목 List 잘 들어왔나 체크 -> null은 dto에서 검증
        if(cartItemIds.isEmpty()){ // 빈 리스트일 수 있으니 체크
            throw new IllegalStateException("구매할 장바구니 항목을 선택해주세요.");
        }

        // 받아온 항목(id 목록)을 DB에서 한 번에 조회
        List<CartItem> cartItems = cartItemRepository.findAllById(cartItemIds);
        // cartItemIds : 숫자 목록
        // cartItems : 실제 장바구니 엔티티 목록

        // 받아온 항목(ids)과 넣은 항목(items) 개수 동일한지 size 체크
        // 존재하지 않는 장바구니 항목 id가 섞여있나 체크
        if(cartItems.size() != cartItemIds.size()){
            throw new IllegalStateException("존재하지 않는 장바구니 상품이 포함되어있습니다.");
        }

        // 장바구니 본인건지 확인
        for(CartItem cartItem : cartItems){
            validateCartItemOwner(cartItem, memberId);
        }

        // 장바구니 상품들에서 productId만 따로 추출
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
        Long orderId = orderService.create(member, orderItems); // 주문상품 리스트로 실제 주문서 생성

        cartItemRepository.deleteAll(cartItems); // 구매한 상품 장바구니에서 삭제

        return orderId; // 주문 번호
    }

    // Cart 조회 또는 생성 메서드 -> 있으면 꺼내기, 없으면 만들어 보내기
    private Cart getOrCreateCart(Member member) {
        return cartRepository.findByMemberId(member.getId()) //있으면 꺼내기
                .orElseGet(()-> cartRepository.save(Cart.createCart(member))); // 없으면 만들기
    }

    // cartItem 조회 메서드
    private CartItem getCartItemOrThrow(Long cartItemId){
        return cartItemRepository.findById(cartItemId)
                .orElseThrow(()-> new IllegalStateException("장바구니 안에 상품이 없습니다."));
    }

    // 검증 메서드 -> 본인 장바구니인지
    private void validateCartItemOwner(CartItem cartItem, Long memberId) {
        if (!cartItem.getCart().getMember().getId().equals(memberId)) {
            throw new IllegalStateException("본인의 장바구니가 아닙니다.");
        }
    }

    // 회원카트 -> 비회원 임시 카트 -> 로그인 시 병합. 확장 생각해보기
}
