package demo.demo_spring.notice.dto;

import demo.demo_spring.notice.domain.Notice;
import org.aspectj.weaver.ast.Not;

import java.time.LocalDateTime;

public class NoticeDetailResponse {
    private String title;
    private String content;
    private LocalDateTime createdAt;

    private NoticeDetailResponse(Notice notice){
        this.title = notice.getTitle(); this.content = notice.getContent();
        this.createdAt = notice.getCreatedAt();
    }

    public static NoticeDetailResponse fromEntity(Notice notice){return new NoticeDetailResponse(notice);}
}
