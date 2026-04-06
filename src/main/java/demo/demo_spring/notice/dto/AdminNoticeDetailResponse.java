package demo.demo_spring.notice.dto;

import demo.demo_spring.notice.domain.Notice;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AdminNoticeDetailResponse {
    private Long id;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updateAt;

    private AdminNoticeDetailResponse(Notice notice){
        this.id = notice.getId();
        this.title = notice.getTitle(); this.content = notice.getContent();
        this.createdAt = notice.getCreatedAt(); this.updateAt = notice.getUpdatedAt();
    }

    public static AdminNoticeDetailResponse fromEntity(Notice notice){
        return new AdminNoticeDetailResponse(notice);}
}
