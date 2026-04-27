package demo.demo_spring.review.repository;

import demo.demo_spring.review.domain.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    // 리뷰 이미 존재하는지 중복 체크 -> OrderItem 엔티티의 Id로 체크
    boolean existsByOrderItemId(Long orderItemId);

    // 내 리뷰보기
    List<Review> findAllByMemberIdOrderByCreatedAtDesc(Long memberId);

    /* 리뷰 조회 */
    // 최신순 + 전체 별점
    Page<Review> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);
    // 최신순 + 특정 별점
    Page<Review> findByProductIdAndRatingOrderByCreatedAtDesc(Long productId, Integer rating, Pageable pageable);

    // 추천순 + 전체 별점
    Page<Review> findByProductIdOrderByLikeCountDescCreatedAtDesc(Long productId, Pageable pageable);
    // 추천순 + 특정 별점
    Page<Review> findByProductIdAndRatingOrderByLikeCountDescCreatedAtDesc(
            Long productId,
            Integer rating,
            Pageable pageable
    );

    // 해당 상품의 전체 리뷰 수
    Long countByProductId(Long productId);

    // 해당 상품에서 특정 별점 리뷰 수
    Long countByProductIdAndRating(Long productId, Integer rating); //재사용하기 위해 rating넣어 만듦.

    // 해당 상품의 평균 별점
    @Query("select avg(r.rating) from Review r where r.product.id = :productId")
    Double findAverageRatingByProductId(Long productId);


}
