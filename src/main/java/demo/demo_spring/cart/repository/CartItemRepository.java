package demo.demo_spring.cart.repository;

import demo.demo_spring.cart.domain.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository <CartItem, Long> {
    // 내 장바구니에 이미 있는 상품인지 확인
    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);

    // (회원용) 내 장바구니 상품인지 확인
    Optional<CartItem> findByIdAndCartMemberId(Long cartItemId, Long memberId);
    // (비회원용) 내 장바구니 상품인지 확인
    Optional<CartItem> findByIdAndCartGuestToken(Long cartItemId, String guestToken);

    // (회원용) 해당 회원의 장바구니 항목 중 선택된 상품들만 조회
    List<CartItem> findByCartMemberIdAndSelectedTrue(Long memberId);

    // cart 목록 전체 비우기
    // 파생 delete 메서드 대신 명시적 JPQL bulk delete를 사용해 cartId 기준으로 CartItem을 직접 삭제
    // bulk delete 이후 영속성 컨텍스트와 DB 상태가 어긋나지 않도록 flush/clear 설정
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from CartItem ci where ci.cart.id=:cartId")

    void deleteAllByCartId(Long cartId);

}
