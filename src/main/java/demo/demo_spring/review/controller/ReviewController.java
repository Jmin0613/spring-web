package demo.demo_spring.review.controller;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.review.domain.ReviewSortType;
import demo.demo_spring.review.dto.*;
import demo.demo_spring.review.service.ReviewService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ReviewController {
    private final ReviewService reviewService;
    public ReviewController(ReviewService reviewService){
        this.reviewService = reviewService;
    }

    // 리뷰글 작성
    @PostMapping("/products/{productId}/reviews")
    public Long like(@PathVariable Long productId, @RequestBody @Valid ReviewCreateRequest request,
                     HttpSession session){
        Member loginMember = (Member) session.getAttribute("loginMember");
        return reviewService.create(productId, loginMember.getId(), request);
    }

    // 리뷰글 수정
    @PatchMapping("/products/{productId}/reviews/{reviewId}")
    public void update(@PathVariable Long productId, @PathVariable Long reviewId,
                       @RequestBody ReviewUpdateRequest request, HttpSession session){
        Member loginMember = (Member) session.getAttribute("loginMember");
        reviewService.update(productId, reviewId, loginMember.getId(), request);
    }

    // 리뷰글 삭제
    @DeleteMapping("/products/{productId}/reviews/{reviewId}")
    public void delete(@PathVariable Long productId, @PathVariable Long reviewId,
                       HttpSession session){
        Member loginMember = (Member) session.getAttribute("loginMember");
        reviewService.delete(productId, reviewId, loginMember.getId());
    }

    // 리뷰 조회
    @GetMapping("/products/{productId}/reviews")
    public ReviewPageResponse findAllReview(@PathVariable long productId,
                                            @RequestParam(defaultValue = "BEST") ReviewSortType sort,
                                            @RequestParam(required = false) Integer rating,
                                            // required = false -> rating 파라미터가 있어도 된고 없어도 된다. (없으면 전체 별점)
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "10") int size){
        return reviewService.findAllReview(productId, sort, rating, page, size);
    }

    // 리뷰 통계
    @GetMapping("/products/{productId}/reviews/summary")
    public ReviewSummaryResponse findReviewSummary(@PathVariable Long productId) {
        return reviewService.findReviewSummary(productId);
    }

    // 리뷰 추천/취소 -> Toggle
    @PostMapping("/products/{productId}/reviews/{reviewId}/like")
    public ReviewLikeToggleResponse likeToggle(@PathVariable Long productId, @PathVariable Long reviewId, HttpSession session){
        Member loginMember = (Member) session.getAttribute("loginMember");
        return reviewService.likeToggle(productId, reviewId, loginMember.getId());
    }
}
