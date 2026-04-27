package demo.demo_spring.mypage.dto;

import demo.demo_spring.review.domain.Review;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class MyPageReviewListResponse {
    private Long reviewId;
    private Long productId;
    private String productNameSnapshot;

    private Integer rating;
    private String title;
    private String content;
    private int likeCount;
    private LocalDateTime createdAt;

    private MyPageReviewListResponse(Review review){
        this.reviewId = review.getId(); this.productId = review.getProduct().getId();
        this.productNameSnapshot = review.getProductNameSnapshot();
        this.rating = review.getRating();
        this.title = review.getTitle();
        this.content = review.getContent();
        this.createdAt = review.getCreatedAt();
        this.likeCount = review.getLikeCount();
    }

    public static MyPageReviewListResponse fromEntity(Review review){return new MyPageReviewListResponse(review);}
}
