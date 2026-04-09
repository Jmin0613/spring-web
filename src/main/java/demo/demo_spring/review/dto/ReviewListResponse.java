package demo.demo_spring.review.dto;

import demo.demo_spring.review.domain.Review;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ReviewListResponse {
    private Long reviewId;
    private String writerName;

    private Integer rating;
    private String title;
    private String content;

    private LocalDateTime createdAt;

    private ReviewListResponse(Review review){
        this.reviewId = review.getId();
        this.writerName = review.getMember().getName();
        this.rating = review.getRating();
        this.title = review.getTitle();
        this.content = review.getContent();
        this.createdAt = review.getCreatedAt();
    }

    public static ReviewListResponse fromEntity(Review review){
        return new ReviewListResponse(review);
    }
}
