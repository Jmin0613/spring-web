package demo.demo_spring.productInquiry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ProductInquiryCreateRequest {
    @NotBlank(message = "문의 제목을 입력해주세요.")
    private String title;
    @NotBlank(message = "문의 내용을 입력해주세요.")
    private String content;

    private boolean secret;
}
