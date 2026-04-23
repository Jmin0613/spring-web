package demo.demo_spring.review.repository;

import demo.demo_spring.review.domain.ReviewLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReviewLikeRepository extends JpaRepository <ReviewLike, Long> {
    // 리뷰 추천 이미 했는지 체크
    Optional<ReviewLike> findByMemberIdAndReviewId(Long memberId, Long reviewId);

    // 로그인한 사용자가 리뷰 추천 눌렀는지 체크
    boolean existsByMemberIdAndReviewId(long memberId, Long reviewId);
}
