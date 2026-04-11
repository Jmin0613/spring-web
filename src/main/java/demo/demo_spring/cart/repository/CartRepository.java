package demo.demo_spring.cart.repository;

import demo.demo_spring.cart.domain.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository <Cart, Long>{
    // member cart 찾아오기
    Optional<Cart> findByMemberId(Long memberId);
    // 회원당 cart는 1개씩
    // cart 없으면 새로 만들어야 하니 Optional

}
