package demo.demo_spring.review.repository;

import demo.demo_spring.review.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    // 해당 상품 리뷰 전체 조회
    List<Review> findAllByProductIdOrderByCreatedAtDesc(Long productId);
    // find all + By Product_id + Order By Created At Desc
    // 모두 찾아라 + Product id를 기준으로 검색
    // createdAt 기준으로 내림차순 정렬
    // 특정 상품(ProductId)에 달린 리뷰들을 createAt 최신순으로 전부 조회

    // 리뷰 이미 존재하는지 중복 체크 -> OrderItem 엔티티의 Id로 체크
    boolean existsByOrderItemId(Long orderItemId);
}
