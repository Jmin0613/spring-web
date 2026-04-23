package demo.demo_spring.review.dto;

import demo.demo_spring.review.domain.Review;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ReviewListResponse {
    // 리뷰 1개 카드 데이터

    private Long reviewId;
    private String writerNickName;

    private Integer rating;
    private String title;
    private String content;

    private LocalDateTime createdAt;

    private int likeCount;
    private String productNameSnapshot;
    private int quantity;

    private boolean likedByCurrentUser;

    private ReviewListResponse(Review review, boolean likedByCurrentUser){
        this.reviewId = review.getId();
        this.writerNickName = review.getMember().getNickName();
        this.rating = review.getRating();
        this.title = review.getTitle();
        this.content = review.getContent();
        this.createdAt = review.getCreatedAt();
        this.likeCount = review.getLikeCount();
        this.productNameSnapshot = review.getProductNameSnapshot();
        this.quantity = review.getOrderItem().getQuantity();
        this.likedByCurrentUser = likedByCurrentUser;
    }

    public static ReviewListResponse fromEntity(Review review, boolean likedByCurrentUser){
        return new ReviewListResponse(review, likedByCurrentUser);
    }
}
