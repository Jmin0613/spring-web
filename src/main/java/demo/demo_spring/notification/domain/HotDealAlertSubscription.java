package demo.demo_spring.notification.domain;

import demo.demo_spring.hotdeal.domain.HotDeal;
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
@Table(
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_hotDealAlert_member_hotDeal",
                        columnNames = {"member_id", "hotDeal_id"}
                )
        }
)
public class HotDealAlertSubscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotDeal_id", nullable = false)
    private HotDeal hotDeal;

    // member_id + hot_deal_id 복합 unique 제약
    // -> 이 member가 이 hotDeal에 시작 알림을 신청했다.

    @CreatedDate
    private LocalDateTime createdAt;

    private HotDealAlertSubscription (Member member, HotDeal hotDeal){
        // null 체크
        if(member == null){
            throw new IllegalStateException("로그인이 필요합니다.");
        }
        if(hotDeal == null){
            throw new IllegalStateException("시작 알림 신청하시려는 핫딜 상품이 없습니다.");
        }
        this.member = member; this.hotDeal = hotDeal;
    }

    public static HotDealAlertSubscription createHotDealAlert(Member member, HotDeal hotDeal){ return new HotDealAlertSubscription(member, hotDeal); }


}
