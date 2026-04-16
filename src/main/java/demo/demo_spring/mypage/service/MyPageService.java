package demo.demo_spring.mypage.service;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.repository.MemberRepository;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.mypage.dto.*;
import demo.demo_spring.order.domain.Orders;
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
    private final MemberRepository memberRepository;

    public MyPageService(ProductInquiryRepository inquiryRepository,
                         ReviewRepository reviewRepository, WishlistRepository wishlistRepository, OrderRepository orderRepository, MemberService memberService, MemberRepository memberRepository){
        this.inquiryRepository = inquiryRepository;
        this.reviewRepository = reviewRepository; this.wishlistRepository = wishlistRepository;
        this.orderRepository = orderRepository; this.memberService = memberService;
        this.memberRepository = memberRepository;
    }

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

    // 내 찜하기 보기 + DTO 재활용
    public List<WishlistListResponse> findMyWishlist(Long memberId){
        //멤버 조회
        memberService.getMember(memberId);
        //찜 목록 조회
        return wishlistRepository.findAllByMemberIdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(WishlistListResponse::fromEntity)
                .toList();

    }

    // 내 정보 변경 - nickName, email
    public void updateProfile(MemberUpdateRequest request, Long memberId){
        //멤버 조회
        Member member = memberService.getMember(memberId);

        String nickName = request.getNickName(); String email = request.getEmail();

        // 변경값 체크
        if(nickName == null && email == null){
            throw new IllegalStateException("수정할 정보가 없습니다.");
        }

        // 닉네임 중복체크 + 기본 닉네임과 같은지 체크
        if(nickName != null && !nickName.equals(member.getNickName())){
            // 다를 경우, 중복검사 실행
            if(memberRepository.existsByNickName(nickName)){
                throw new IllegalStateException("중복된 닉네임입니다.");
            }
        }
        // 이메일 중복체크 + 기존 이메일과 같은지 체크
        if(email != null && !email.equals(member.getEmail())) {
            // 다를 경우, 중복검사 실행
            if (memberRepository.existsByEmail(email)) {
                throw new IllegalStateException("중복된 이메일입니다.");
            }
        }

        // 통과하면 수정메서드 호출
        member.updateProfile(request.getNickName(), request.getEmail());

    }
    // 내 비밀번호 변경
    public void changePassword(MemberPasswordChangeRequest request, Long memberId){
        //멤버 조회
        Member member = memberService.getMember(memberId);

        //현재 비밀번호 확인
        if(!member.getPassword().equals(request.getCurrentPassword())){
            throw new IllegalStateException("현재 비밀번호가 일치하지 않습니다.");
        }

        // 새 비밀번호 + 비밀번호 확인 일치 여부
        if(!request.getNewPassword().equals(request.getNewPasswordConfirm())){
            throw new IllegalStateException("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        }

        // 기존 비밀번호와 동일한지 확인
        if(member.getPassword().equals(request.getNewPassword())){
            throw new IllegalStateException("기존 비밀번호와 동일한 비밀번호로는 변경할 수 없습니다.");
        }

        // 통과하면 비밀번호 변경 메서드 호출
        member.changePassword(request.getNewPassword());

    }

    // 내 주문 상세보기 -> Orders 필드 리팩토링떄 확장하고 받는사람 정보 등 추가하기
    public MyPageOrderDetailResponse findMyOrderDetail(Long orderId, Long memberId){
        // 멤버 조회
        memberService.getMember(memberId);

        // 주문 조회
        Orders order = orderRepository.findByIdAndMemberId(orderId, memberId)
                .orElseThrow(()-> new IllegalStateException("해당하는 주문이 없거나 접근 권한이 없습니다."));

        return MyPageOrderDetailResponse.fromEntity(order);
    }
}
