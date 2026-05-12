package demo.demo_spring.review.dto;

import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
public class ReviewPageResponse {
    // ReviewListResponse 여러개를 담을 페이지 응답용 DTO

    private ReviewSummaryResponse summary; // 리뷰 통계 (별점 평균, 리뷰 개수)
    private List<ReviewListResponse> reviews; // 현재 페이지에 실제로 보여줄 리뷰 목록 (카드로 들어갈 리뷰들)

    private int page; // 현재 페이지 번호
    private int size; // 한 페이지에 보여줄 개수

    private long totalElements; // 전체 리뷰 수
    private int totalPages; // 전체 페이지 수

    // 앞 뒤 페이지 존재 여부
    private boolean hasNext;
    private boolean hasPrevious;

    private ReviewPageResponse(ReviewSummaryResponse summary, List<ReviewListResponse> reviews,
                               Page<?> pageInfo) {
        this.summary = summary;
        this.reviews = reviews;
        this.page = pageInfo.getNumber();
        this.size = pageInfo.getSize();
        this.totalElements = pageInfo.getTotalElements();
        this.totalPages = pageInfo.getTotalPages();
        this.hasNext = pageInfo.hasNext();
        this.hasPrevious = pageInfo.hasPrevious();
    }

    public static ReviewPageResponse of(ReviewSummaryResponse summary, List<ReviewListResponse> reviews,
                                        Page<?> pageInfo) {
        return new ReviewPageResponse(summary, reviews, pageInfo);
    }

}