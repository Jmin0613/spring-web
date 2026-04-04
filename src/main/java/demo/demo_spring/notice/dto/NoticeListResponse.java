package demo.demo_spring.notice.dto;

import demo.demo_spring.notice.domain.Notice;

import java.time.LocalDateTime;

public class NoticeListResponse {
    private String title;
    private LocalDateTime createdAt;

    private NoticeListResponse(Notice notice){
        this.title=notice.getTitle();
        this.createdAt = notice.getCreatedAt();
    }

    public static NoticeListResponse fromEntity(Notice notice){return new NoticeListResponse(notice);}
}
