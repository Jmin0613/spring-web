package demo.demo_spring.hotdeal.controller;

import demo.demo_spring.hotdeal.dto.HotDealBuyRequest;
import demo.demo_spring.hotdeal.dto.HotDealDetailResponse;
import demo.demo_spring.hotdeal.dto.HotDealListResponse;
import demo.demo_spring.hotdeal.service.HotDealService;
import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.notification.dto.HotDealAlertToggleResponse;
import demo.demo_spring.notification.service.NotificationService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequiredArgsConstructor
public class HotDealController {

    private final HotDealService hotDealService;
    private final NotificationService notificationService;

    // 전체 조회
    @GetMapping("/hotdeals")
    public List<HotDealListResponse> findAllHotDeal(){
        return hotDealService.findAllHotDeal();
    }

    // 단건 조회
    @GetMapping("/hotdeals/{hotDealId}")
    public HotDealDetailResponse findById(@PathVariable Long hotDealId, HttpSession session){
        Member loginMember = (Member) session.getAttribute("loginMember");

        // 알림 신청 여부 표시 -> 비로그인 경우 null
        Long memberId = null;
        if(loginMember != null){
            memberId = loginMember.getId();
        }

        return hotDealService.findHotDeal(hotDealId, memberId);
    }

    // 핫딜 구매 -> PortOne 결제 도입 후 사용x 레거시 구매API.
    @PostMapping("/hotdeals/{hotDealId}/buy") // /payment/prepate -> /payment/complete로 연결
    public Long legacyByy(@PathVariable Long hotDealId, @RequestBody @Valid HotDealBuyRequest request, HttpSession session){
        throw new ResponseStatusException(
                HttpStatus.GONE,
                "기존 HotDeal 구매 API는 더 이상 사용되지 않음. /paymnet/prepate 사용 바람."
        );
    }

    @PostMapping("/hotdeals/{hotDealId}/alerts/toggle")
    public HotDealAlertToggleResponse alertToggle(@PathVariable Long hotDealId, HttpSession session) {
        Member loginMember = (Member) session.getAttribute("loginMember");
        return notificationService.alertToggle(hotDealId, loginMember.getId());
    }
}