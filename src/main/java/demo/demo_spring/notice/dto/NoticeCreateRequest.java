package demo.demo_spring.notice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class NoticeCreateRequest {
    @NotBlank(message = "공지 제목을 입력해주세요.")
    private String title;
    @NotBlank(message = "공지 내용을 입력해주세요.")
    private String content;
}
