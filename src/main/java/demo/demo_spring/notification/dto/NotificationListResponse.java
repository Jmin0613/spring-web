package demo.demo_spring.notification.dto;

import demo.demo_spring.notification.domain.Notification;
import demo.demo_spring.notification.domain.NotificationType;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class NotificationListResponse {
    private Long notificationId;
    private NotificationType type;

    private String title;
    private String content;

    private boolean isRead;
    private Long productId;
    private Long inquiryId;
    private LocalDateTime createdAt;



    private NotificationListResponse(Notification notification){
        this.notificationId = notification.getId(); this.type = notification.getType();
        this.title = notification.getTitle(); this.content = notification.getContent();
        this.isRead = notification.isRead(); this.createdAt = notification.getCreatedAt();
        this.productId = notification.getProductId(); this.inquiryId = notification.getInquiryId();
    }

    public static NotificationListResponse fromEntity(Notification notification){
        return new NotificationListResponse(notification);
    }
}
