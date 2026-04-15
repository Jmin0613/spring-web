package demo.demo_spring.review.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ReviewCreateRequest {
    @NotNull
    private Long orderItemId;

    @NotNull(message = "별점을 선택해주세요.")
    private Integer rating;

    @NotBlank(message = "리뷰 제목을 입력해주세요.")
    private String title;
    @NotBlank(message = "리뷰 내용을 입력해주세요.")
    private String content;
}
