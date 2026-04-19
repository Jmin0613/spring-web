package demo.demo_spring.wishlist.repository;

import demo.demo_spring.wishlist.domain.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    // 중복 찜 방지
    boolean existsByMemberIdAndProductId(Long memberID, Long productId);

    // 찜 조회
    Optional<Wishlist> findByMemberIdAndProductId(Long memberId, Long productId);

    // 찜 목록 조회
    List<Wishlist> findAllByMemberIdOrderByCreatedAtDesc(Long memberId);
}
