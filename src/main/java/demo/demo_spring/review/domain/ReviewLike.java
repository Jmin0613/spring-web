package demo.demo_spring.review.domain;

import demo.demo_spring.member.domain.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uk_review_like_member_review",
                        columnNames = {"member_id","review_id"}
                )
)
public class ReviewLike {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @CreatedDate
    private LocalDateTime createdAt;

    // member_id + review_id unique 제약 추가
    // ReviewLike 존재 여부 -> 내가 이 리뷰를 추천했는지 (관계 판단)
    // Review.likeCount -> 전체 추천 수 (개수 조회)

    private ReviewLike(Member member, Review review){
        if(member == null){ throw new IllegalStateException("추천한 회원이 없습니다."); } // 누가 눌렀는지
        if(review == null){ throw new IllegalStateException("추천 대상 리뷰가 없습니다."); } // 어떤 리뷰를 눌렀는지

        this.member = member; this.review = review;
    }

    public static ReviewLike create(Member member, Review review){
        return new ReviewLike(member, review);
    }
}
