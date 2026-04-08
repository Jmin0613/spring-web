package demo.demo_spring.productInquiry.controller;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.productInquiry.dto.ProductInquiryCreateRequest;
import demo.demo_spring.productInquiry.dto.ProductInquiryUpdateRequest;
import demo.demo_spring.productInquiry.service.ProductInquiryService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

@RestController
public class ProductInquiryController {
    private final ProductInquiryService productInquiryService;
    public ProductInquiryController(ProductInquiryService productInquiryService){
        this.productInquiryService = productInquiryService;
    }

    // 문의글 작성
    @PostMapping("/products/{productId}/inquiries")
    public Long create(@PathVariable Long productId, @RequestBody ProductInquiryCreateRequest request,
                       HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        return productInquiryService.create(productId, loginMember.getId(), request);
    }

    // 문의글 수정
    @PatchMapping("/products/{inquiryId}/inquiries")
    public void update(@PathVariable Long inquiryId, @RequestBody ProductInquiryUpdateRequest request,
                       HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        productInquiryService.update(inquiryId, loginMember.getId(), request);
    }

}
