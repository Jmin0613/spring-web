package demo.demo_spring.notification.repository;

import demo.demo_spring.notification.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findAllByMemberIdOrderByCreatedAtDesc(Long memberId);
    Optional<Notification> findByIdAndMemberId(Long notificationId, Long memberId);

}
