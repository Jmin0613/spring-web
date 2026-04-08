package demo.demo_spring.productInquiry.dto;

import demo.demo_spring.productInquiry.domain.InquiryStatus;
import demo.demo_spring.productInquiry.domain.ProductInquiry;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ProductInquiryDetailResponse {
    private Long InquiryId;
    private Long productId;
    private String productNameSnapshot; //구매 당시 상품 이름
    private String writerName; //작성자 이름

    private String title;
    private String content;
    private InquiryStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String answerContent; //답변 내용
    private LocalDateTime answeredAt; //답변일


    private ProductInquiryDetailResponse(ProductInquiry productInquiry){
        this.InquiryId = productInquiry.getId(); this.productId =productInquiry.getProduct().getId();
        this.productNameSnapshot = productInquiry.getProductNameSnapshot();
        this.title = productInquiry.getTitle(); this.content = productInquiry.getContent();
        this.writerName = productInquiry.getMember().getName(); this.status = productInquiry.getStatus();
        this.createdAt =productInquiry.getCreatedAt(); this.updatedAt =productInquiry.getUpdatedAt();
        this.answerContent= productInquiry.getAnswerContent(); this.answeredAt = productInquiry.getAnsweredAt();
    }

    public static ProductInquiryDetailResponse fromEntity(ProductInquiry productInquiry){
        return new ProductInquiryDetailResponse(productInquiry);
    }
}
