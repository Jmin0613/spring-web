package demo.demo_spring.productInquiry.dto;

import demo.demo_spring.productInquiry.domain.InquiryStatus;
import demo.demo_spring.productInquiry.domain.ProductInquiry;
import lombok.Getter;

import java.time.*;

@Getter
public class ProductInquiryDetailResponse {
    private Long inquiryId;
    private Long productId;
    private String productNameSnapshot;
    private String riternickName;

    private String title;
    private String content;
    private InquiryStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String answerContent;
    private LocalDateTime answeredAt;


    private ProductInquiryDetailResponse(ProductInquiry productInquiry){
        this.inquiryId = productInquiry.getId(); this.productId =productInquiry.getProduct().getId();
        this.productNameSnapshot = productInquiry.getProductNameSnapshot();
        this.title = productInquiry.getTitle(); this.content = productInquiry.getContent();
        this.riternickName = productInquiry.getMember().getNickName(); this.status = productInquiry.getStatus();
        this.createdAt =productInquiry.getCreatedAt(); this.updatedAt =productInquiry.getUpdatedAt();
        this.answerContent= productInquiry.getAnswerContent(); this.answeredAt = productInquiry.getAnsweredAt();
    }

    public static ProductInquiryDetailResponse fromEntity(ProductInquiry productInquiry){
        return new ProductInquiryDetailResponse(productInquiry);
    }
}
