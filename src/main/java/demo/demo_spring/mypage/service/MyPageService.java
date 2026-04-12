package demo.demo_spring.mypage.service;

import demo.demo_spring.member.repository.MemberRepository;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.mypage.dto.MyPageInquiryListResponse;
import demo.demo_spring.mypage.dto.MyPageOrderListResponse;
import demo.demo_spring.mypage.dto.MyPageReviewListResponse;
import demo.demo_spring.order.repository.OrderRepository;
import demo.demo_spring.productInquiry.repository.ProductInquiryRepository;
import demo.demo_spring.review.repository.ReviewRepository;
import demo.demo_spring.wishlist.dto.WishlistListResponse;
import demo.demo_spring.wishlist.repository.WishlistRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MyPageService {
    private final ProductInquiryRepository inquiryRepository;
    private final ReviewRepository reviewRepository;
    private final WishlistRepository wishlistRepository;
    private final OrderRepository orderRepository;
    private final MemberService memberService;

    public MyPageService(ProductInquiryRepository inquiryRepository,
                         ReviewRepository reviewRepository, WishlistRepository wishlistRepository, OrderRepository orderRepository, MemberService memberService){
        this.inquiryRepository = inquiryRepository;
        this.reviewRepository = reviewRepository; this.wishlistRepository = wishlistRepository;
        this.orderRepository = orderRepository; this.memberService = memberService;
    }

    // 내 주문기록 보기 -> Order쪽 주문 조회, 주문 상세 조회를 마이페이지에서 보는걸로 통합하기. (리팩토링)
    public List<MyPageOrderListResponse> findMyOrders(Long memberId){
        // 멤버 조회
        memberService.getMember(memberId);
        // memberId로 조회
        return orderRepository.findAllByMemberIdOrderByOrderDateDesc(memberId)
                .stream()
                .map(MyPageOrderListResponse::fromEntity)
                .toList();

    }

    // 내 문의 목록 보기
    public List<MyPageInquiryListResponse> findMyInquiries(Long memberId){
        // 멤버 조회
        memberService.getMember(memberId);
        // memberId로 조회
        return inquiryRepository.findAllByMemberIdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(MyPageInquiryListResponse::fromEntity)
                .toList();

    }

    // 내 리뷰 목록 보기
    public List<MyPageReviewListResponse> findMyReviews(Long memberId){
        // 멤버 조회
        memberService.getMember(memberId);
        // memberId로 조회
        return reviewRepository.findAllByMemberIdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(MyPageReviewListResponse::fromEntity)
                .toList();

    }

    // 내 찜하기 보기
    public List<WishlistListResponse> findMyWishlist(Long memberId){ // DTO 재활용
        //멤버 조회
        memberService.getMember(memberId);
        //찜 목록 조회
        return wishlistRepository.findAllByMemberIdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(WishlistListResponse::fromEntity)
                .toList();

    }
}
