package demo.demo_spring.notice.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AdminNoticeCreateRequest {
    private String title;
    private String content;
}
