package demo.demo_spring.cart.repository;

import demo.demo_spring.cart.domain.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository <CartItem, Long> {
    // 같은 상품이 이미 cart에 있는지 확인
    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);

    // cart 목록 전체 비우기
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    // 삭제 후 영속성 컨텍스트 정리
    // 삭제 쿼리 실행 전에 영속성 컨텍스트 내용을 먼저 DB에 반영(flush)
    @Query("delete from CartItem ci where ci.cart.id=:cartId")
    // delete -> 조회한거 전부 삭제해라
    // from CartItem ci -> 조회할 대상은 CartItem이라는 엔티티
    // where ci.cart=: -> 그중에서 cart의 id 필드값이 내가 파라미터로 넣은 cartId와 같은 것만 골라내라
    void deleteAllByCartId(Long cartId);

    // 그전에는 그냥 했더니, 뭔가 애매했는지, 삭제할 것들은 찾지만 막상 삭제가 안되고 있었음.
    // 왜인지는 모르겟지만 select는 되어도  delete가 안되는 상황.
    // 아니면 삭제는 됐는데, 영속성 문제때문에 애매하게 작동해서 삭제가 안된 것 처럼 보엿을 수 있음.
    // 그래서 그냥 아예 스프링이 애매하게 느끼지 않고 직접 써서 못박아버림.

}
