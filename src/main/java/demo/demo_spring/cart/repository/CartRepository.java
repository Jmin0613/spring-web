package demo.demo_spring.cart.repository;

import demo.demo_spring.cart.domain.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository <Cart, Long>{
    // member cart 찾아오기

    // 회원이면 memberId사용
    Optional<Cart> findByMemberId(Long memberId);

    // 비회원이면 guestToken사용
    Optional<Cart> findByGuestToken(String guestToken);

}
