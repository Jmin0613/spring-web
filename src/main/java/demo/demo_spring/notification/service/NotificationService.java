package demo.demo_spring.notification.service;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.repository.HotDealRepository;
import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.notification.domain.Notification;
import demo.demo_spring.notification.dto.NotificationListResponse;
import demo.demo_spring.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final MemberService memberService;
    private final HotDealRepository hotDealRepository;

    public NotificationService(NotificationRepository notificationRepository, MemberService memberService, HotDealRepository hotDealRepository){
        this.notificationRepository = notificationRepository;
        this.memberService = memberService;
        this.hotDealRepository = hotDealRepository;
    }

    // 문의 답변 등록 알림 생성
    public void createInquiryAnswerNotification(Long productId, Long inquiryId, Long memberId, String inquiryTitle){
        Member member = memberService.getMember(memberId);

        // 저장
        Notification notification =
                Notification.createInquiryAnswerNotification(member, inquiryTitle, productId, inquiryId);

        Notification savedNotification = notificationRepository.save(notification);
        // return savedNotification.getId();
    }

    // 핫딜 시작 알림 생성
    public void createHotDealStartNotification(Long hotDealId, Long memberId){
        Member member = memberService.getMember(memberId);
        Optional<HotDeal> hotDeal = hotDealRepository.findById(hotDealId);
        if(hotDeal.isEmpty()){
            throw new IllegalStateException("알림 대상 핫딜 상품이 비어있습니다.");
        }
        HotDeal foundHotDeal = hotDeal.get();
        String hotDealName = foundHotDeal.getProduct().getName();

        // 저장
        Notification notification =
                Notification.createHotDealStartNotification(member, hotDealId, hotDealName);

        Notification savedNotification = notificationRepository.save(notification);
        // return savedNotification.getId();
    }


    // 내 알림 조회
    public List<NotificationListResponse> findMyNotifications(Long memberId){
        // 멤버 확인
        memberService.getMember(memberId);

        // 문의 조회
        return notificationRepository.findAllByMemberIdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(NotificationListResponse::fromEntity)
                .toList();
    }

    // 알림 읽기
    public void readNotification(Long notificationId, Long memberId){
        // 멤버 조회
        memberService.getMember(memberId);

        // 알림 존재 여부 + 내 알림 여부 체크
        Notification notification = notificationRepository.findByIdAndMemberId(notificationId, memberId)
                .orElseThrow(()->new IllegalStateException("읽어들일 알림이 없습니다."));

        notification.markAsRead();
    } // ---> 알림 클릭 시, 읽음처리 + 이동 정보 반환하여 상세페이지로 이동하는걸로 리팩토링
}
