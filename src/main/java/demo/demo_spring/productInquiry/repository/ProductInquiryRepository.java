package demo.demo_spring.productInquiry.repository;

import demo.demo_spring.productInquiry.domain.ProductInquiry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductInquiryRepository extends JpaRepository<ProductInquiry,Long> {
    // 해당 상품의 문의만 보기
    List<ProductInquiry> findAllByProductIdOrderByCreatedAtDesc(Long productId);

    // 내 문의보기
    List<ProductInquiry> findAllByMemberIdOrderByCreatedAtDesc(Long memberId);

    // (관리자) - 전체문의 최신순
    List<ProductInquiry> findAllByOrderByCreatedAtDesc();

}
