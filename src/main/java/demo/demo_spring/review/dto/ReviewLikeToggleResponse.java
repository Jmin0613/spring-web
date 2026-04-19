package demo.demo_spring.review.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor // 응답 필드 단순 + 단순 결과 반환
public class ReviewLikeToggleResponse {
    private Long reviewId;
    private boolean liked; // 추천 버튼 상태 변경을 위해 프론트에 넘겨줄 값
    private int likeCount;
}
