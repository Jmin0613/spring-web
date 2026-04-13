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
    private Long productId;
    private Long inquiryId;

    private Notification(Member member, NotificationType type){
        // null 체크
        if(member == null){ throw new IllegalStateException("알림을 받을 회원이 비어있습니다."); }
        if(type == null){ throw new IllegalStateException("알림의 종류가 비어있습니다."); }

        this.member = member; this.type = type;
        this.isRead = false; //false가 생성일떄 기본값
    }

    public static Notification createInquiryAnswerNotification(Member member, String inquiryTitle, Long productId, Long inquiryId){
        Notification notification =  new Notification(member, NotificationType.INQUIRY_ANSWER);

        if(productId == null){ throw new IllegalStateException("알림 대상 상품이 비어있습니다."); }
        if(inquiryId == null){ throw new IllegalStateException("알림 대상 문의가 비어있습니다."); }
        if(inquiryTitle == null || inquiryTitle.isBlank()){
            throw new IllegalStateException("알림 대상 문의 제목이 비어있습니다.");
        }

        notification.title = "문의에 답변이 달렸습니다.";
        notification.content = "\"" + inquiryTitle + "\"에 관리자 답변이 달렸습니다.";
        notification.productId = productId; notification.inquiryId = inquiryId;

        return notification;
    }

    public static Notification createHotDealStartNotification(Member member, Long hotDealId, String hotDealName){
        Notification notification =  new Notification(member, NotificationType.HOTDEAL_START);
        if(hotDealId == null){ throw new IllegalStateException("알림 대상 핫딜 상품이 비어있습니다."); }
        notification.title = "핫딜이 곧 시작합니다.";
        notification.content = "\"" + hotDealName + "\"핫딜 상품이 곧 판매를 시작합니다.";
        notification.productId = hotDealId;

        return notification;
    }
}
