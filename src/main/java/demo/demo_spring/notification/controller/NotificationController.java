package demo.demo_spring.notification.controller;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.notification.dto.NotificationListResponse;
import demo.demo_spring.notification.service.NotificationService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class NotificationController {
    private final NotificationService notificationService;
    public NotificationController(NotificationService notificationService){
        this.notificationService = notificationService;
    }

    // 내 알림 목록 조회용
    @GetMapping("/notifications")
    public List<NotificationListResponse> findMyNotifications(HttpSession session){
        Member loginMember = (Member) session.getAttribute("loginMember");
        return notificationService.findMyNotification(loginMember.getId());
    }


}
