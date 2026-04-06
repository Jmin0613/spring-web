package demo.demo_spring.notice.dto;

import demo.demo_spring.notice.domain.Notice;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AdminNoticeListResponse {
    private Long id;
    private String title;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private AdminNoticeListResponse(Notice notice){
        this.id = notice.getId();
        this.title=notice.getTitle();
        this.createdAt = notice.getCreatedAt();
        this.updatedAt = notice.getUpdatedAt();
    }

    public static AdminNoticeListResponse fromEntity(Notice notice){return new AdminNoticeListResponse(notice);}
}
