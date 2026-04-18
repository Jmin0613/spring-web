package demo.demo_spring.notification.repository;

import demo.demo_spring.notification.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // 멤버별 알림 전체 조회
    List<Notification> findAllByMemberIdOrderByCreatedAtDesc(Long memberId);

    // 알림 읽기 위해 존재 여부 확인
    Optional<Notification> findByIdAndMemberId(Long notificationId, Long memberId);

}
