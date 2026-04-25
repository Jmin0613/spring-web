package demo.demo_spring.hotdeal.controller;

import demo.demo_spring.hotdeal.dto.HotDealBuyRequest;
import demo.demo_spring.hotdeal.dto.HotDealDetailResponse;
import demo.demo_spring.hotdeal.dto.HotDealListResponse;
import demo.demo_spring.hotdeal.service.HotDealService;
import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.notification.service.NotificationService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class HotDealController {
    //생성자주입 + di
    private final HotDealService hotDealService;
    private final NotificationService notificationService;

    public HotDealController(HotDealService hotDealService, MemberService memberService, NotificationService notificationService){
        this.hotDealService = hotDealService;
        this.notificationService = notificationService;
    }

    // 전체 조회
    @GetMapping("/hotdeals")
    public List<HotDealListResponse> findAllHotDeal(){
        return hotDealService.findAllHotDeal();
    }

    // 단건 조회
    @GetMapping("/hotdeals/{hotDealId}")
    public HotDealDetailResponse findById(@PathVariable Long hotDealId){
        return hotDealService.findHotDeal(hotDealId);
    }

    // 핫딜 구매
    @PostMapping("/hotdeals/{hotDealId}/buy")
    public String buy(@PathVariable Long hotDealId, @RequestBody @Valid HotDealBuyRequest request, HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        hotDealService.buy(
                hotDealId, request.getQuantity(), loginMember.getId(),
                request.getDeliveryInfo(), request.getPaymentMethod()
        );
        return "구매 성공";
    }

    // 시작 알림 신청
    @PostMapping("/hotdeals/{hotDealId}/alerts")
    public void subscribeAlert(@PathVariable Long hotDealId, HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        notificationService.subscribeAlert(hotDealId, loginMember.getId());
    }

    // 시작 알림 취소
    @DeleteMapping("/hotdeals/{hotDealId}/alerts")
    public void unsubscribeAlert(@PathVariable Long hotDealId, HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        notificationService.unsubscribeAlert(hotDealId, loginMember.getId());
    }
}