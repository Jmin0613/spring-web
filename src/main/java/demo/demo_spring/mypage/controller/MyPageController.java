package demo.demo_spring.mypage.controller;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.mypage.dto.*;
import demo.demo_spring.mypage.service.MyPageService;
import demo.demo_spring.wishlist.dto.WishlistListResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class MyPageController {
    private final MyPageService mypageService;

    public MyPageController(MyPageService mypageService) {
        this.mypageService = mypageService;
    }

    @GetMapping("/mypage/inquiries") // 내 문의 목록 보기
    public List<MyPageInquiryListResponse> findMyInquiries(HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        return mypageService.findMyInquiries(loginMember.getId());
    }

    @GetMapping("/mypage/reviews") // 내 리뷰 목록 보기
    public List<MyPageReviewListResponse> findMyReviews(HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        return mypageService.findMyReviews(loginMember.getId());
    }

    @GetMapping("/mypage/wishlist") // 내 찜하기 보기
    public List<WishlistListResponse> findMywishlist(HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        return mypageService.findMyWishlist(loginMember.getId());
    }

    @PatchMapping("/mypage/myinfo") // 내 정보 변경 - email, nickName
    public void updateProfile(@RequestBody MemberUpdateRequest request, HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        mypageService.updateProfile(loginMember.getId(), request);
    }

    @GetMapping("/mypage/orders") // 내 주문기록 보기
    public List<MyPageOrderListResponse> findMyOrders(HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember"); // 로그인세션 꺼내는 것도 공통화 염두해두기 (리팩토링)
        return mypageService.findMyOrders(loginMember.getId());
    }

    @GetMapping("/mypage/orders/{orderId}") // 내 주문 상세보기
    public MyPageOrderDetailResponse findMyOrderDetail(@PathVariable Long orderId, HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        return mypageService.findMyOrderDetail(orderId, loginMember.getId());
    }

}
