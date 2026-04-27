package demo.demo_spring.mypage.controller;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.dto.MemberInfoResponse;
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

    // 마이페이지 메인 화면용 - 내 정보 조회
    @GetMapping("/mypage/myinfo")
    public MemberInfoResponse findMyEditInfo(HttpSession session) {
        Member loginMember = (Member)session.getAttribute("loginMember");
        return mypageService.findMyInfo(loginMember.getId());
    }

    //내 정보 변경 전, 비밀번호 인증
    @PostMapping("/mypage/password-check")
    public void checkPassword(@RequestBody @Valid MemberPasswordCheckRequest request, HttpSession session) {
        Member loginMember = getLoginMember(session);

        // 비밀번호 인증
        mypageService.checkPassword(request, loginMember.getId());

        // 내 정보 변경을 위한 접근 인증 완료 표시
        session.setAttribute("mypageVerifiedMemberId", loginMember.getId());
    }

    //내 정보 변경 페이지 조회
    @GetMapping("/mypage/edit-myinfo")
    public MemberInfoResponse findEditMyInfo(HttpSession session){
        Member loginMember = getLoginMember(session);
        return mypageService.findMyInfo(loginMember.getId());
    }

    // 내 정보 변경 - 닉네임, 이메일, 폰번호, 비밀번호
    @PatchMapping("/mypage/edit-myinfo")
    public void updateProfile(@RequestBody MemberEditMyInfoRequest request, HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        mypageService.editMyInfo(request, loginMember.getId());
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


    /* 헬퍼 메서드 */

    //로그인한 회원인지 체크. 두 번이나 쓰여서 빼둠.
    private Member getLoginMember(HttpSession session) {
        Member loginMember = (Member)session.getAttribute("loginMember");

        if (loginMember == null) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }
        return loginMember;
    }

}
