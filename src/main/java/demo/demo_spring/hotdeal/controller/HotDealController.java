package demo.demo_spring.hotdeal.controller;

import demo.demo_spring.hotdeal.dto.HotDealBuyRequest;
import demo.demo_spring.hotdeal.dto.HotDealDetailResponse;
import demo.demo_spring.hotdeal.dto.HotDealListResponse;
import demo.demo_spring.hotdeal.service.HotDealService;
import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class HotDealController {
    //생성자주입 + di
    private final HotDealService hotDealService;
    private final MemberService memberService;
    public HotDealController(HotDealService hotDealService, MemberService memberService){
        this.hotDealService = hotDealService;
        this.memberService = memberService;
    }

    // 전체 조회
    @GetMapping("/hotdeals")
    public List<HotDealListResponse> findAllHotDeal(){
        return hotDealService.findAllHotDeal();
    }

    // 단건 조회
    @GetMapping("/hotdeals/{id}")
    public HotDealDetailResponse findById(@PathVariable Long id){
        return hotDealService.findHotDeal(id);
    }

    // 핫딜 구매
    @PostMapping("/hotdeals/{id}/buy")
    public String buy(@PathVariable Long id, @RequestBody HotDealBuyRequest request, HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        hotDealService.buy(id, request.getQuantity(), loginMember.getId());
        return "구매 성공";
    }
}