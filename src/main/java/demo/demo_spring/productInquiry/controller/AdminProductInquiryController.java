package demo.demo_spring.productInquiry.controller;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.productInquiry.dto.AdminProductInquiryAnswerRequest;
import demo.demo_spring.productInquiry.service.ProductInquiryService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminProductInquiryController {
    private final ProductInquiryService productInquiryService;
    public AdminProductInquiryController(ProductInquiryService productInquiryService){
        this.productInquiryService = productInquiryService;
    }

    // 관리자 답글 작성
    @PostMapping("/admin/products/{productId}/inquiries/{inquiryId}/answer")
    public void answer(@PathVariable Long productId, @PathVariable Long inquiryId,
                       @RequestBody AdminProductInquiryAnswerRequest request,
                       HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        productInquiryService.adminAnswer(productId, inquiryId, loginMember.getId(), request);
    }

    // 문의 조회는 ProductInquiryController를 공용으로 쓰기.
    // 답글하기 버튼은 프론트엔드에서 role권한 확인하고 ui보여주는걸로.
}
