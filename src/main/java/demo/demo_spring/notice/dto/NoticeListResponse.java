package demo.demo_spring.notice.dto;

import demo.demo_spring.notice.domain.Notice;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class NoticeListResponse {
    private Long id;
    private String title;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private NoticeListResponse(Notice notice){
        this.id = notice.getId();
        this.title=notice.getTitle();
        this.createdAt = notice.getCreatedAt();
        this.updatedAt = notice.getUpdatedAt();
    }

    public static NoticeListResponse fromEntity(Notice notice){return new NoticeListResponse(notice);}
}
