package demo.demo_spring.mypage.dto;

import demo.demo_spring.productInquiry.domain.InquiryStatus;
import demo.demo_spring.productInquiry.domain.ProductInquiry;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class MyPageInquiryListResponse {
    private Long inquiryId;
    private Long productId;
    private String productNameSnapshot;

    private String title;
    private boolean secret;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private InquiryStatus status;

    private MyPageInquiryListResponse(ProductInquiry productInquiry){
        this.inquiryId = productInquiry.getId(); this.productId = productInquiry.getProduct().getId();
        this.productNameSnapshot = productInquiry.getProductNameSnapshot();
        this.title = productInquiry.getTitle(); this.secret = productInquiry.isSecret();
        this.createdAt = productInquiry.getCreatedAt(); this.updatedAt = productInquiry.getUpdatedAt();
        this.status = productInquiry.getStatus();
    }

    public static MyPageInquiryListResponse fromEntity(ProductInquiry productInquiry){
        return new MyPageInquiryListResponse(productInquiry);
    }
}
