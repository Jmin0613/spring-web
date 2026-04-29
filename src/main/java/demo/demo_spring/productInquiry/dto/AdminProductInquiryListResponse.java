package demo.demo_spring.productInquiry.dto;

import demo.demo_spring.productInquiry.domain.InquiryStatus;
import demo.demo_spring.productInquiry.domain.ProductInquiry;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AdminProductInquiryListResponse {
    // 관리자 문의관리 -> 문의목록 카드 응답DTO

    private Long inquiryId;
    private Long productId;
    private String productNameSnapshot;

    private Long memberId;
    private String writerName;
    private String writerNickName;

    private String title;
    private InquiryStatus status;
    private boolean secret;

    private LocalDateTime createdAt;
    private LocalDateTime answeredAt;

    private AdminProductInquiryListResponse(ProductInquiry inquiry) {
        this.inquiryId = inquiry.getId();

        this.productId = inquiry.getProduct().getId();
        this.productNameSnapshot = inquiry.getProductNameSnapshot();

        this.memberId = inquiry.getMember().getId();
        this.writerName = inquiry.getMember().getName();
        this.writerNickName = inquiry.getMember().getNickName();

        this.title = inquiry.getTitle();
        this.status = inquiry.getStatus();
        this.secret = inquiry.isSecret();

        this.createdAt = inquiry.getCreatedAt();
        this.answeredAt = inquiry.getAnsweredAt();
    }

    public static AdminProductInquiryListResponse fromEntity(ProductInquiry inquiry) {
        return new AdminProductInquiryListResponse(inquiry);
    }
}
