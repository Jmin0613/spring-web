package demo.demo_spring.review.dto;

import demo.demo_spring.review.domain.Review;
import lombok.Getter;

@Getter
public class ReviewSummaryResponse {
    // 리뷰 통계
    // 엔티티 1개를 옮겨 담는게 아닌,
    // 여러 repository 조회 결과(집계 결과)를 조합해서 만드는 DTO

    private Double averageRating; // 평균 별점
    private Long totalCount; // 리뷰 개수

    // 각 별점
    private Long fiveStarCount;
    private Long fourStarCount;
    private Long threeStarCount;
    private Long twoStarCount;
    private Long oneStarCount;

    private ReviewSummaryResponse(Double averageRating, Long totalCount,
                                  Long fiveStarCount, Long fourStarCount, Long threeStarCount,
                                  Long twoStarCount, Long oneStarCount){
        this.averageRating = averageRating;
        this.totalCount = totalCount;
        this.fiveStarCount = fiveStarCount;
        this.fourStarCount = fourStarCount;
        this.threeStarCount = threeStarCount;
        this.twoStarCount = twoStarCount;
        this.oneStarCount = oneStarCount;
    }

    public static ReviewSummaryResponse of(Double averageRating, Long totalCount,
                                           Long fiveStarCount, Long fourStarCount, Long threeStarCount,
                                           Long twoStarCount, Long oneStarCount){
        return new ReviewSummaryResponse(
                averageRating, totalCount,
                fiveStarCount,fourStarCount,threeStarCount,
                twoStarCount,oneStarCount);
    }

}
