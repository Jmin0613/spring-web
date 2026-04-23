package demo.demo_spring.productInquiry.dto;

import demo.demo_spring.productInquiry.domain.InquiryStatus;
import demo.demo_spring.productInquiry.domain.ProductInquiry;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ProductInquiryListResponse {
    private Long id;
    private String title;
    private String writerNickName; //작성자 닉네임
    private InquiryStatus status;
    private LocalDateTime createdAt; // 작성일
    private Long writerId; //작성자 id

    private ProductInquiryListResponse(ProductInquiry productInquiry){
        this.id = productInquiry.getId();
        this.title = productInquiry.getTitle();
        this.writerNickName = productInquiry.getMember().getNickName();
        this.status = productInquiry.getStatus();
        this.createdAt = productInquiry.getCreatedAt();
        this.writerId = productInquiry.getMember().getId();
    }

    public static ProductInquiryListResponse fromEntity(ProductInquiry productInquiry){
        return new ProductInquiryListResponse(productInquiry);
    }
}
