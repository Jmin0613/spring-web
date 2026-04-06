package demo.demo_spring.notice.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AdminNoticeUpdateRequest {
    private String title;
    private String content;
}
