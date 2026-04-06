package demo.demo_spring.notice.dto;

import demo.demo_spring.notice.domain.Notice;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class NoticeDetailResponse {
    private Long id;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private NoticeDetailResponse(Notice notice){
        this.id = notice.getId();
        this.title = notice.getTitle(); this.content = notice.getContent();
        this.createdAt = notice.getCreatedAt(); this.updatedAt = notice.getUpdatedAt();
    }

    public static NoticeDetailResponse fromEntity(Notice notice){
        return new NoticeDetailResponse(notice);}
}
