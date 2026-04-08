package demo.demo_spring.productInquiry.controller;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.productInquiry.dto.ProductInquiryCreateRequest;
import demo.demo_spring.productInquiry.dto.ProductInquiryDetailResponse;
import demo.demo_spring.productInquiry.dto.ProductInquiryListResponse;
import demo.demo_spring.productInquiry.dto.ProductInquiryUpdateRequest;
import demo.demo_spring.productInquiry.service.ProductInquiryService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ProductInquiryController {
    private final ProductInquiryService productInquiryService;
    public ProductInquiryController(ProductInquiryService productInquiryService){
        this.productInquiryService = productInquiryService;
    }

    // 문의글 작성
    @PostMapping("/products/{productId}/inquiries")
    public Long create(@PathVariable Long productId,
                       @RequestBody ProductInquiryCreateRequest request, HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        return productInquiryService.create(productId, loginMember.getId(), request);
    }

    // 문의글 수정
    @PatchMapping("/products/{productId}/inquiries/{inquiryId}")
    public void update(
            @PathVariable Long productId, @PathVariable Long inquiryId,
            @RequestBody ProductInquiryUpdateRequest request, HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        productInquiryService.update(productId, inquiryId, loginMember.getId(), request);
    }

    // 문의글 삭제
    @DeleteMapping("/products/{productId}/inquiries/{inquiryId}")
    public void delete(
            @PathVariable Long productId, @PathVariable Long inquiryId, HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        productInquiryService.delete(productId, inquiryId, loginMember.getId());
    }

    // 상품별 문의 목록 조회
    @GetMapping("/products/{productId}/inquiries")
    public List<ProductInquiryListResponse> findAllProductInquiries(
            @PathVariable Long productId){
        return productInquiryService.findAllInquiresByProduct(productId);
    }

    // 문의 단건 상세 조회
    @GetMapping("/products/{productId}/inquiries/{inquiryId}")
    public ProductInquiryDetailResponse findProductInquiry(
            @PathVariable Long productId,@PathVariable Long inquiryId, HttpSession session){
        //비밀글 -> 관리자 및 작성만 확인 가능

        // 로그인 null 체크 -> 아직 인터셉터 안넣어줘서 수동으로 체크
        // null을 보내는건 되지만, null에서 getId()꺼내면 안되기에 memberId선언
        Member loginMember = (Member)session.getAttribute("loginMember");
        Long memberId =null;
        if(loginMember != null){
            memberId = loginMember.getId();
        }
        return productInquiryService.findInquiry(productId, inquiryId, memberId);
    }
}
