package demo.demo_spring.productInquiry.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ProductInquiryUpdateRequest {
    private String title;
    private String content;
}
