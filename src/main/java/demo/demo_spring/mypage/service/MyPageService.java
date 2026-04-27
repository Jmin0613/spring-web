package demo.demo_spring.mypage.service;

import demo.demo_spring.global.validatationPatterns.PasswordValidator;
import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.dto.MemberInfoResponse;
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
import java.util.Set;
import java.util.stream.Collectors;

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

        // 특정 회원이 단 모든 리뷰 가져오기
        List<Orders> orders = orderRepository.findAllByMemberIdOrderByOrderDateDesc(memberId);

        // 해당 주문상품에 이미 리뷰 달은 id 목록
        Set<Long> reviewedOrderItemIds = findReviewedOrderItemIds(orders);

        return orders.stream()
                .map(order -> MyPageOrderListResponse.fromEntity(order, reviewedOrderItemIds))
                .toList();
    }
    // 리뷰 작성 완료된 orderItemId 목록 만들기
    private Set<Long> findReviewedOrderItemIds(List<Orders> orders){
        return orders.stream() //하나씩 꺼내기
                .flatMap(order -> order.getOrderItems().stream())
                // 각 order안에 들어가있는 orderItem들을 하나씩 펼쳐서 꺼내기
                .filter(orderItem -> reviewRepository.existsByOrderItemId(orderItem.getId()))
                // 이 orderItemId로 작성된 리뷰 있는지 존재 체크. false면 orderItem값 버리기.
                .map(orderItem -> orderItem.getId()) //남은 orderItem객체들 중에서 id만 꺼내기
                .collect(Collectors.toSet()); //이 id들(리뷰 작성된 id) 모아서 set만듦.
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

    // 내 주문 상세보기
    public MyPageOrderDetailResponse findMyOrderDetail(Long orderId, Long memberId){
        // 멤버 조회
        memberService.getMember(memberId);

        // 주문 조회
        Orders order = orderRepository.findByIdAndMemberId(orderId, memberId)
                .orElseThrow(()-> new IllegalStateException("해당하는 주문이 없거나 접근 권한이 없습니다."));

        return MyPageOrderDetailResponse.fromEntity(order);
    }

    // 내 정보 조회
    public MemberInfoResponse findMyInfo(Long memberId) {
        Member member = memberService.getMember(memberId);
        return MemberInfoResponse.fromEntity(member);
    }

    // 내 정보 변경 전, 비밀번호 인증
    public void checkPassword(MemberPasswordCheckRequest request, Long memberId) {
        // 멤버 조회
        Member member = memberService.getMember(memberId);

        // 비밀번호 인증
        if (!member.getPassword().equals(request.getCurrentPassword())) {
            throw new IllegalStateException("비밀번호가 일치하지 않습니다.");
        }
    }

    // 내 정보 변경 - nickName, email, phoneNumber, password
    public void editMyInfo(MemberEditMyInfoRequest request, Long memberId){
        //멤버 조회
        Member member = memberService.getMember(memberId);

        //normalize -> 앞뒤 공백 제거
        String nickName = normalize(request.getNickName());
        String email = normalize(request.getEmail());
        String phoneNumber = normalize(request.getPhoneNumber());

        String currentPassword = normalize(request.getCurrentPassword());
        String newPassword = normalize(request.getNewPassword());
        String newPasswordConfirm = normalize(request.getNewPasswordConfirm());

        // 변경 시도 체크
        // null 또는 빈 문자열이면, 변경하지 않는 값으로 판단하기 위해 null반환.
        boolean profileChanged = hasProfileChange(member, nickName, email, phoneNumber);
        boolean passwordChangeRequested = isPasswordChangeRequested(
                // 셋 중 하나라도 입력 -> 변경 시도로 체크 -> true
                currentPassword,
                newPassword,
                newPasswordConfirm
        );

        //모두 null일 경우
        if(!profileChanged && !passwordChangeRequested){
            throw new IllegalStateException("수정할 정보가 없습니다.");
        }

        //하나라도 변경 시도 있을 경우
        // 회원 기본정보 변경 - 중복체크 + 기존값과 비교 후, 변경
        if (profileChanged) {
            validateProfile(member, nickName, email, phoneNumber);
            member.updateProfile(nickName, email, phoneNumber);
        }
        // 비밀번호 변경 - 세 값 모두 입력 확인 + 현재 비밀번호 인증 + 새 비밀번호 입력 확인 + 기존값가 비교 후, 변경
        if (passwordChangeRequested) {
            validatePasswordChange(member, currentPassword, newPassword, newPasswordConfirm);
            member.changePassword(newPassword);
        }

    }

    // 데이터 정제 -> 앞뒤 공백 제거
    private String normalize(String value){
        if(value == null){
            return null;
        }
        String trimmed = value.trim();

        if(trimmed.isEmpty()){ // 공백만 들어왔을 경우, trim()이후 값이 비어버림.
            return null;
        } // 변경값 썻다가 지우고 저장해도 오류아니라, 변경 안함으로 처리.

        return trimmed;
    }

    // 회원 기본정보 변경 시도 체크
    private boolean hasProfileChange(Member member, String nickName, String email, String phoneNumber){
        // 닉네임 변경
        if(nickName != null && !nickName.equals(member.getNickName())){
            return true;
        }
        // 이메일 변경
        if(email != null && !email.equals(member.getEmail())){
            return true;
        }
        // 핸드폰 번호 변경
        if(phoneNumber != null && !phoneNumber.equals(member.getPhoneNumber())){
            return true;
        }

        return false;
    }

    // 비밀번호 변경 시도 체크
    private boolean isPasswordChangeRequested(String currentPassword, String newPassword, String newPasswordConfirm){
        // 셋 중 하나라도 null아니면 비밀번호 변경 시도로 판단 -> true반환.
        return currentPassword != null || newPassword != null || newPasswordConfirm != null;
    }

    // 회원 기본정보 변경 - 중복체크 + 기존값과 비교 후, 변경
    private void validateProfile(Member member, String nickName, String email, String phoneNumber){
        // 닉네임 중복체크 + 기본 닉네임과 같은지 체크
        if(nickName != null && !nickName.equals(member.getNickName())){
            if (memberRepository.existsByNickName(nickName)) {
                throw new IllegalStateException("중복된 닉네임입니다.");
            }
        }
        // 이메일 중복체크 + 기존 이메일과 같은지 체크
        if(email != null && !email.equals(member.getEmail())){
            if (memberRepository.existsByEmail(email)) {
                throw new IllegalStateException("중복된 이메일입니다.");
            }
        }
        // 핸드폰 번호 중복체크 + 기존 번호와 같은지 체크
        if(phoneNumber != null && !phoneNumber.equals(member.getPhoneNumber())){
            if (memberRepository.existsByPhoneNumber(phoneNumber)) {
                throw new IllegalStateException("중복된 전화번호입니다.");
            }
        }
    }

    // 비밀번호 변경 - 세개 다 입력 + 중복체크 + 기존값 비교
    private void validatePasswordChange(Member member, String currentPassword, String newPassword, String newPasswordConfirm){
        //세 값 모두 입력
        if(currentPassword == null){ throw new IllegalStateException("현재 비밀번호를 입력해주세요."); }
        if(newPassword == null){ throw new IllegalStateException("새 비밀번호를 입력해주세요."); }
        if(newPasswordConfirm == null){ throw new IllegalStateException("새 비밀번호 확인을 입력해주세요."); }

        //현재 비밀번호 인증
        if(!member.getPassword().equals(currentPassword)){ throw new IllegalStateException("현재 비밀번호가 일치하지 않습니다."); }
        // 새 비밀번호 입력 확인
        if(!newPassword.equals(newPasswordConfirm)){ throw new IllegalStateException("새 비밀번호와 비밀번호 확인이 일치하지 않습니다."); }
        // 기존 비밀번호와 비교
        if(member.getPassword().equals(newPassword)){ throw new IllegalStateException("기존 비밀번호와 동일한 비밀번호로는 변경할 수 없습니다."); }
        // 비밀번호 패턴 체크
        if(!newPassword.matches(PasswordValidator.PASSWORD)){
            throw new IllegalStateException(
                    "새 비밀번호는 12자 이상이며, 대문자 1개 이상, 소문자 1개 이상, 숫자 1개 이상, 특수문자 1개 이상을 포함해야 합니다."
            );
        }
    }
}
