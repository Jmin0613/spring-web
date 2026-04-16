package demo.demo_spring.mypage.controller;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.mypage.dto.*;
import demo.demo_spring.mypage.service.MyPageService;
import demo.demo_spring.order.service.OrderService;
import demo.demo_spring.wishlist.dto.WishlistListResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class MyPageController {
    private final MyPageService mypageService;
    private final OrderService orderService;

    public MyPageController(MyPageService mypageService, OrderService orderService) {
        this.mypageService = mypageService;
        this.orderService = orderService;
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
        mypageService.updateProfile(request, loginMember.getId());
    }
    @PatchMapping("/mypage/password") // 내 비밀번호 변경
    public void changePassword(@RequestBody @Valid MemberPasswordChangeRequest request, HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        mypageService.changePassword(request, loginMember.getId());
    }

    @GetMapping("/mypage/orders") // 내 주문기록 보기
    public List<MyPageOrderListResponse> findMyOrders(HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        return mypageService.findMyOrders(loginMember.getId());
    }

    @GetMapping("/mypage/orders/{orderId}") // 내 주문 상세보기
    public MyPageOrderDetailResponse findMyOrderDetail(@PathVariable Long orderId, HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        return mypageService.findMyOrderDetail(orderId, loginMember.getId());
    }

    @PatchMapping("/mypage/orders/{orderId}/cancel") // 주문 취소
    public void cancelOrder(@PathVariable Long orderId, HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        orderService.cancel(orderId, loginMember.getId());
    }

}
