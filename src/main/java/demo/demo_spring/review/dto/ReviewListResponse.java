package demo.demo_spring.review.dto;

import demo.demo_spring.review.domain.Review;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ReviewListResponse {
    private Long reviewId;
    private String writerNickName;

    private Integer rating;
    private String title;
    private String content;

    private LocalDateTime createdAt;

    private ReviewListResponse(Review review){
        this.reviewId = review.getId();
        this.writerNickName = review.getMember().getNickName();
        this.rating = review.getRating();
        this.title = review.getTitle();
        this.content = review.getContent();
        this.createdAt = review.getCreatedAt();
    }

    public static ReviewListResponse fromEntity(Review review){
        return new ReviewListResponse(review);
    }
}
