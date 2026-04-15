package demo.demo_spring.productInquiry.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AdminProductInquiryAnswerRequest {
    @NotBlank(message = "문의 답변을 입력해주세요.")
    private String answerContent;
}
