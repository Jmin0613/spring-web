package demo.demo_spring.productInquiry.dto;

import demo.demo_spring.productInquiry.domain.InquiryStatus;
import demo.demo_spring.productInquiry.domain.ProductInquiry;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ProductInquiryListResponse {
    private Long id;
    private String title;
    private String writerName; //작성자 이름
    private InquiryStatus status;
    private LocalDateTime createdAt; // 작성일

    private ProductInquiryListResponse(ProductInquiry productInquiry){
        this.title = productInquiry.getTitle();
        this.writerName = productInquiry.getMember().getName();
        this.status = productInquiry.getStatus();
        this.createdAt = productInquiry.getCreatedAt();
    }

    public static ProductInquiryListResponse fromEntity(ProductInquiry productInquiry){
        return new ProductInquiryListResponse(productInquiry);
    }
}
