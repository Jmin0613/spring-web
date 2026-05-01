package demo.demo_spring.payment.controller;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.payment.dto.*;
import demo.demo_spring.payment.service.PaymentService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // 주문 결제 준비하기
    @PostMapping("/prepare")
    public PaymentPrepareResponse preparePayment(@RequestBody PaymentPrepareRequest request, HttpSession session){
        Member loginMember = getLoginMember(session);
        return paymentService.preparePayment(loginMember.getId(), request);
    }

    // 주문 결제 완료하기
    @PostMapping("/complete")
    public PaymentCompleteResponse completePayment(@RequestBody PaymentCompleteRequest request, HttpSession session){
        Member loginMember = getLoginMember(session); //보안을 위해 회원 검증 추가
        return paymentService.completePayment(loginMember.getId(), request);
    }

    // 주문 취소하기
    @PostMapping("/cancel")
    public PaymentCancelResponse cancelPayment(@RequestBody PaymentCancelRequest request, HttpSession session){
        Member loginMember = getLoginMember(session);
        return paymentService.cancelPayment(loginMember.getId(), request);
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
