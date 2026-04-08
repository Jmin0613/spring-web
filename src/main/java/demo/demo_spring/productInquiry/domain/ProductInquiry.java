package demo.demo_spring.productInquiry.domain;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.product.domain.Product;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class ProductInquiry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private String productNameSnapshot;
    private String title;
    private String content;
    private String answerContent;

    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime answeredAt;

    @Enumerated(EnumType.STRING)
    private InquiryStatus status;

    private ProductInquiry(Member member, Product product,
                           String title, String content) {
        this.member = member;
        this.product = product;
        this.productNameSnapshot = product.getName();
        this.title = title;
        this.content = content;
        this.status = InquiryStatus.WAITING;
    }

    // 문의글 등록/생성 메서드
    public static ProductInquiry createInquiry(Member member, Product product,
                                               String title, String content) {
        // null체크
        if (member == null) {
            throw new IllegalStateException("문의글 작성 전 로그인이 필요합니다.");
        }
        if (product == null) {
            throw new IllegalStateException("문의를 작성하시려는 상품이 없습니다.");
        }
        if (title == null || title.isBlank()){
            throw new IllegalStateException("문의글 제목이 비어있습니다.");
        }
        if (content == null || content.isBlank()){
            throw new IllegalStateException("문의글 내용이 비어있습니다.");
        }

        return new ProductInquiry(member, product, title, content);
    }

    // 문의글 수정 메서드
    public void updateInquiry(String title, String content) {
        validateWaitingStatus();
        if (title != null && !title.isBlank()) {
            this.title = title;
        }
        if (content != null && !content.isBlank()) {
            this.content = content;
        }
    }

    // 문의글 답변 메서드 -> 생성 메서드
    public void answer(String answerContent, LocalDateTime now){
        validateWaitingStatus();
        if(answerContent == null || answerContent.isBlank()){
            throw new IllegalStateException("답변 내용이 비어있습니다.");
        }
        if(now == null){
            throw new IllegalStateException("답변 등록 시간이 잘못되었습니다.");
        }this.answerContent = answerContent; this.answeredAt = now;
        this.status = InquiryStatus.ANSWERED;
    }

    // 상태체크 메서드
    private void validateWaitingStatus(){
        if(this.status != InquiryStatus.WAITING){
            throw new IllegalStateException("이미 답변 완료된 문의입니다.");
        }

    }

}
