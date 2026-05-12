package demo.demo_spring.notification.service;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.repository.HotDealRepository;
import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.notification.domain.HotDealAlertSubscription;
import demo.demo_spring.notification.domain.Notification;
import demo.demo_spring.notification.dto.HotDealAlertToggleResponse;
import demo.demo_spring.notification.dto.NotificationListResponse;
import demo.demo_spring.notification.repository.HotDealAlertSubscriptionRepository;
import demo.demo_spring.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import static demo.demo_spring.hotdeal.domain.HotDealStatus.READY;

@Service
@Transactional
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final MemberService memberService;
    private final HotDealRepository hotDealRepository;
    private final HotDealAlertSubscriptionRepository hotDealAlertSubscriptionRepository;

    public NotificationService(NotificationRepository notificationRepository, MemberService memberService, HotDealRepository hotDealRepository, HotDealAlertSubscriptionRepository hotDealAlertSubscriptionRepository){
        this.notificationRepository = notificationRepository;
        this.memberService = memberService;
        this.hotDealRepository = hotDealRepository;
        this.hotDealAlertSubscriptionRepository = hotDealAlertSubscriptionRepository;
    }

    // 문의 답변 등록 알림 생성
    public void createInquiryAnswerNotification(Long productId, Long inquiryId, Long memberId, String inquiryTitle){
        Member member = memberService.getMember(memberId);

        // 저장
        Notification notification =
                Notification.createInquiryAnswerNotification(member, inquiryTitle, inquiryId, productId);

        Notification savedNotification = notificationRepository.save(notification);
    }

    // 핫딜 시작 알림 생성 및 발송
    public void createHotDealPreStartNotification(Long hotDealId){
        // 핫딜 존재 여부 체크
        HotDeal hotDeal = hotDealRepository.findById(hotDealId)
                .orElseThrow(()-> new IllegalStateException("해당하는 핫딜 상품이 없습니다."));

        // 해당 핫딜 신청 목록 조회
        List<HotDealAlertSubscription> hotDealAlerts =
                hotDealAlertSubscriptionRepository.findAllByHotDealId(hotDealId);
        // 비어있으면 return
        if (hotDealAlerts.isEmpty()) {
            return;
        }

        // 최종적으로 저장할 알림 리스트
        List<Notification> notifications = new ArrayList<>();

        // 반복문으로 각 member에 대해 핫딜 시작 알림 객체 생성
        for(HotDealAlertSubscription hotDealAlert : hotDealAlerts){
            Notification notification =
                    Notification.createHotDealPreStartNotification(hotDealAlert.getMember(),
                    hotDeal.getId(), hotDeal.getProduct().getName()
            );

            // 알림 리스트에 추가
            notifications.add(notification);
        }

        // 생성한 알림 목록 저장 (알림 전체 저장)
        notificationRepository.saveAll(notifications);

        // 알림 발송 후, 신청 목록 삭제 (비우기)
        hotDealAlertSubscriptionRepository.deleteAll(hotDealAlerts);
    }

    // 핫딜 시작 알림 Toggle
    public HotDealAlertToggleResponse alertToggle(Long hotDealId, Long memberId) {
        // member 존재 여부 체크
        Member member = memberService.getMember(memberId);

        // hotDeal 존재 여부 체크
        HotDeal hotDeal = hotDealRepository.findById(hotDealId)
                .orElseThrow(() -> new IllegalStateException("알림 신청할 핫딜 상품이 없습니다."));

        // READY만 가능
        if(hotDeal.getStatus() != READY){
            throw new IllegalStateException("핫딜 알림 신청 및 취소는 준비중인 상품에 한하여 가능합니다.");
        }

        // 이미 신청했다면 취소
        if(hotDealAlertSubscriptionRepository.existsByMemberIdAndHotDealId(memberId, hotDealId)){
            hotDealAlertSubscriptionRepository.deleteByMemberIdAndHotDealId(memberId, hotDealId);
            return new HotDealAlertToggleResponse(false); // 신청 안함 상태
        }

        // 신청하지 않았다면 신청
        HotDealAlertSubscription subscription =
                HotDealAlertSubscription.createHotDealAlert(member, hotDeal);

        hotDealAlertSubscriptionRepository.save(subscription);

        return new HotDealAlertToggleResponse(true); // 신청 완료 상태
    }

    /* 핫딜 시작 알림 신청 여부 확인 */

    // 내 알림 조회
    public List<NotificationListResponse> findMyNotifications(Long memberId){
        memberService.getMember(memberId);

        return notificationRepository.findAllByMemberIdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(NotificationListResponse::fromEntity)
                .toList();
    }

    // 알림 읽기
    public void readNotification(Long notificationId, Long memberId){
        memberService.getMember(memberId);

        Notification notification = notificationRepository.findByIdAndMemberId(notificationId, memberId)
                .orElseThrow(()->new IllegalStateException("읽어들일 알림이 없습니다."));

        notification.markAsRead();
    }

    // 알림 모두 읽기
    public void readAllNotifications(Long memberId){
        memberService.getMember(memberId);

        notificationRepository.findAllByMemberIdOrderByCreatedAtDesc(memberId)
                .forEach(Notification::markAsRead);
    }

}
