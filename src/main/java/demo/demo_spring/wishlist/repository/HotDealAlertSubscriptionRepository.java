package demo.demo_spring.wishlist.repository;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.notification.domain.HotDealAlertSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HotDealAlertSubscriptionRepository extends JpaRepository <HotDealAlertSubscription, Long> {
    // 핫딜 시작 알림 신청자 전부 조회
    List<HotDealAlertSubscription> findAllByHotDealId(Long hotDealId);

    // member+hotDeal
    Optional<HotDealAlertSubscription> findByMemberIdAndHotDealId(Long memberId, Long hotDealId);

    // 알림신청 중복검사
    boolean existsByMemberIdAndHotDealId(Long memberId, Long hotDealId);

    // 알림신청 삭제(취소)
    void deleteByMemberIdAndHotDealId(Long memberId, Long hotDealId);

    Long member(Member member);
}
