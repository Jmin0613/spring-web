package demo.demo_spring.notification.dto;

import demo.demo_spring.notification.domain.Notification;
import demo.demo_spring.notification.domain.NotificationTargetType;
import demo.demo_spring.notification.domain.NotificationType;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class NotificationListResponse {
    private Long notificationId;

    private String title;
    private String content;

    private boolean read;

    private NotificationType type;
    private NotificationTargetType targetType;

    private Long targetId;
    private Long relatedId;

    private LocalDateTime createdAt;
    private NotificationListResponse(Notification notification){
        this.notificationId = notification.getId();
        this.title = notification.getTitle(); this.content = notification.getContent();
        this.read = notification.isRead();
        this.type = notification.getType(); this.targetType = notification.getTargetType();
        this.targetId = notification.getTargetId(); this.relatedId = notification.getRelatedTargetId();
        this.createdAt = notification.getCreatedAt();
    }

    public static NotificationListResponse fromEntity(Notification notification){
        return new NotificationListResponse(notification);
    }
}
