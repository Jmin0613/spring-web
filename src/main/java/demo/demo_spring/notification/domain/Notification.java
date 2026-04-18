package demo.demo_spring.notification.domain;

import demo.demo_spring.member.domain.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member; //알림 받는 Member

    @Enumerated(EnumType.STRING)
    private NotificationType type; // 알람 종류 구분
    // -> 지금은 문의 알람뿐이지만, 추후 선택한 핫딜 시작 알림 등 확장 예정 (리팩토링)

    private String title; // 회원에게 보여줄 알림 문구 (제목)
    private String content; // 회원에게 보여줄 알림 문구 (내용)

    @CreatedDate
    private LocalDateTime createdAt; // 알림 생성 일시
    private boolean isRead; // 알람 읽음 여부

    //추후 프론트엔드 확장을 위한 식별값. 이거 받아서 상세페이지로 이동시키기.
    @Enumerated(EnumType.STRING)
    private NotificationTargetType targetType; // HOTDEAL, PRODUCT_INQUIRY, NONE
    private Long targetId; // hotDealId, inquiryId
    private Long relatedTargetId; //PRODUCT_INQUIRY의 경우, productId를 저장

    private Notification(Member member,
                         NotificationType type, NotificationTargetType targetType,
                         Long targetId, Long relatedTargetId){
        // 공통 필수값만 null 체크
        if(member == null){ throw new IllegalStateException("알림을 받을 회원이 없습니다.."); }
        if(type == null){ throw new IllegalStateException("알림의 종류가 없습니다."); }
        if(targetType == null) { throw new IllegalStateException("알림 대상 종류가 없습니다."); }
        if(targetId == null) { throw new IllegalStateException("알림 대상 id가 없습니다."); }
//        if(targetType != NotificationTargetType.NONE && targetId == null){
//            // targetType이 PRODUCT, HOTDEAL, ORDER같은 실제 대상이 있는 알람 -> targetId있어야 함
//            // targetType이 NONE -> 굳이 이동할 필요X, 대상 targetId없어도 됨 (서비스 점검 예정 메세지, 정책 변경 메세지 등등???)
//            throw new IllegalStateException("알림 대상 id가 없습니다.");
//        }

        this.member = member;
        this.type = type; this.targetType = targetType;
        this.targetId = targetId; this.relatedTargetId = relatedTargetId;
        this.isRead = false; //false가 생성일떄 기본값
    }

    // 문의 답변 알림
    public static Notification createInquiryAnswerNotification(Member member, String inquiryTitle, Long inquiryId, Long productId){
        Notification notification =
                new Notification(member,
                        NotificationType.PRODUCT_INQUIRY_ANSWER, NotificationTargetType.PRODUCT_INQUIRY,
                        inquiryId, productId);

        notification.title = "\"%s\"에 관리자 답변이 달렸습니다.".formatted(inquiryTitle);
        notification.content = "\"%s\"에 대한 답변이 등록되었습니다. 클릭하여 답변 내용을 확인하세요."
                .formatted(inquiryTitle);

        return notification;
    }

    // 핫딜 시작 알림
    public static Notification createHotDealPreStartNotification(Member member, Long hotDealId, String hotDealName){
        Notification notification =
                new Notification(
                        member,
                        NotificationType.HOTDEAL_RRESTART_ALERT, NotificationTargetType.HOTDEAL,
                        hotDealId, null);

        notification.title = "핫딜 상품 \"%s\"이 곧 시작합니다.".formatted(hotDealName);
        notification.content = "\"%s\"이 10분 뒤 판매를 시작합니다. 클릭하여 상세 페이지로 이동하여 주세요."
                .formatted(hotDealName);

        return notification;
    }

    // 읽음 처리 메서드
    public void markAsRead(){
        this.isRead = true;
    }

}
