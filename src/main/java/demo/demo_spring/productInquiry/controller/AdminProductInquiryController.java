package demo.demo_spring.productInquiry.controller;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.productInquiry.dto.AdminProductInquiryAnswerRequest;
import demo.demo_spring.productInquiry.dto.AdminProductInquiryDetailResponse;
import demo.demo_spring.productInquiry.dto.AdminProductInquiryListResponse;
import demo.demo_spring.productInquiry.service.ProductInquiryService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminProductInquiryController {
    // 관리자 문의관리

    private final ProductInquiryService productInquiryService;
    public AdminProductInquiryController(ProductInquiryService productInquiryService){
        this.productInquiryService = productInquiryService;
    }

    // 관리자 전체 문의목록 조회
    @GetMapping("/inquiries")
    public List<AdminProductInquiryListResponse> findAllInquiries(HttpSession session){
        Member loginMember = getLoginMember(session); // 로그인체크 다른곳에서도 이렇게 리팩토링해주기
        return productInquiryService.adminFindAllInquiries(loginMember.getId());
    }

    // 관리자 문의 상세 조회
    @GetMapping("/inquiries/{inquiryId}")
    public AdminProductInquiryDetailResponse findInquiryDetail(@PathVariable Long inquiryId, HttpSession session){
        Member loginMember = getLoginMember(session);
        return productInquiryService.adminFindInquiryDetail(inquiryId, loginMember.getId());
    }

    // 관리자 답글 작성
    @PatchMapping("/products/{productId}/inquiries/{inquiryId}/answer")
    public void answer(@PathVariable Long productId, @PathVariable Long inquiryId,
                       @RequestBody @Valid AdminProductInquiryAnswerRequest request,
                       HttpSession session){
        Member loginMember = getLoginMember(session);
        productInquiryService.adminAnswer(productId, inquiryId, loginMember.getId(), request);
    }


    /* 헬퍼 메서드 */

    // 로그인 체크 메서드
    private Member getLoginMember(HttpSession session) {
        Member loginMember = (Member)session.getAttribute("loginMember");

        if (loginMember == null) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }
        return loginMember;
    }
}
