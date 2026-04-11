package demo.demo_spring.cart.repository;

import demo.demo_spring.cart.domain.Cart;
import demo.demo_spring.cart.domain.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository <CartItem, Long> {
    // 같은 상품이 이미 cart에 있는지 확인
    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);

    // cart 목록 조회
    List<CartItem> findAllByCartIdOrderByCreatedAtDesc(Long cartId);

    Long cart(Cart cart);
    // find all + By Cart_id + Order By Created At Desc
    // 모두 찾아라 + cart id를 기준으로 검색
    // createdAt 기준으로 내림차순 정렬
    // CartId에 달린 상품들(cartItems)을 createAt 최신순으로 전부 조회

}
