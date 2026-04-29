package demo.demo_spring.productInquiry.dto;

import demo.demo_spring.productInquiry.domain.InquiryStatus;
import demo.demo_spring.productInquiry.domain.ProductInquiry;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AdminProductInquiryDetailResponse {
    // 관리자 문의관리 -> 문의 상세 DTO

    private Long inquiryId;
    private Long productId;
    private String productNameSnapshot;

    // 작성자 정보
    private Long memberId;
    private String writerName;
    private String writerNickName;

    private String title;
    private String content;

    private boolean secret;
    private InquiryStatus status;

    private String answerContent;

    private LocalDateTime createdAt; //작성일
    private LocalDateTime updatedAt; //수정일
    private LocalDateTime answeredAt; //답변일

    private AdminProductInquiryDetailResponse(ProductInquiry inquiry) {
        this.inquiryId = inquiry.getId();
        this.productId = inquiry.getProduct().getId();
        this.productNameSnapshot = inquiry.getProductNameSnapshot();

        this.memberId = inquiry.getMember().getId();
        this.writerName = inquiry.getMember().getName();
        this.writerNickName = inquiry.getMember().getNickName();

        this.title = inquiry.getTitle();
        this.content = inquiry.getContent();

        this.secret = inquiry.isSecret();
        this.status = inquiry.getStatus();

        this.answerContent = inquiry.getAnswerContent();

        this.createdAt = inquiry.getCreatedAt();
        this.updatedAt = inquiry.getUpdatedAt();
        this.answeredAt = inquiry.getAnsweredAt();
    }

    public static AdminProductInquiryDetailResponse fromEntity(ProductInquiry inquiry) {
        return new AdminProductInquiryDetailResponse(inquiry);
    }
}
