package demo.demo_spring.cart.service;

import demo.demo_spring.cart.domain.Cart;
import demo.demo_spring.cart.domain.CartItem;
import demo.demo_spring.cart.dto.CartItemCreateRequest;
import demo.demo_spring.cart.dto.CartItemListResponse;
import demo.demo_spring.cart.dto.CartItemUpdateRequest;
import demo.demo_spring.cart.repository.CartItemRepository;
import demo.demo_spring.cart.repository.CartRepository;
import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CartService {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final MemberService memberService;
    private final ProductRepository productRepository;

    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository,
                       MemberService memberService, ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.memberService = memberService;
        this.productRepository = productRepository;
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
        Cart cart = getOrCreateCart(member);

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

    // 장바구니 조회
    public List<CartItemListResponse> findCartItems(Long memberId) {
        // member 조회
        memberService.getMember(memberId);

        // cart 조회
        Optional<Cart> foundCart = cartRepository.findByMemberId(memberId); // memberId로 cart 조회

        if (foundCart.isEmpty()) { // cart 없으면 빈 리스트 반환
            return List.of();
        }

        // cart 있으면 cartItem 목록 조회
        Cart cart = foundCart.get();
        return cartItemRepository.findAllByCartIdOrderByCreatedAtDesc(cart.getId())
                .stream().map(CartItemListResponse::fromEntity).toList();
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

    // 리팩토링할때 추가해주기
    // 주문과 바로 연결
    // 선택 주문 / 부분 주문
    // 픔질 상태 반영 고도화
    // 장바구니 전체 비우기
    // 총 수량, 총 금액
    // 회원카트 -> 비회원 임시 카트 -> 로그인 시 병합
}
