package demo.demo_spring.productInquiry.repository;

import demo.demo_spring.productInquiry.domain.ProductInquiry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductInquiryRepository extends JpaRepository<ProductInquiry,Long> {
    // 해당 상품의 문의만 보기
    List<ProductInquiry> findAllByProductIdOrderByCreatedAtDesc(Long productId);
    // find All + By Product_Id + Order By Created At Desc
    // 모두 찾아라
    // Product id를 기준으로 검색
    // createdAt기준으로 내림차순 정렬
    //특정 상품(ProductId)에 달린 문의들을 createAt 최신순으로 전부 조회

    // 특정 회원이 작성한 문의 모아보기 -> 나중에 마이페이지에서 이어지기
    List<ProductInquiry> findAllByMemberIdOrderByCreatedAtDesc(Long memberId);
}
