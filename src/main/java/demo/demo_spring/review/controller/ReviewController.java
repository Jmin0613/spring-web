package demo.demo_spring.review.controller;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.review.dto.ReviewCreateRequest;
import demo.demo_spring.review.dto.ReviewListResponse;
import demo.demo_spring.review.dto.ReviewUpdateRequest;
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
    public Long create(@PathVariable Long productId, @RequestBody @Valid ReviewCreateRequest request,
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

    // 리뷰 전체 조회
    @GetMapping("/products/{productId}/reviews")
    public List<ReviewListResponse> findAllReviews(@PathVariable Long productId){
        return reviewService.findAllReview(productId);
    }
}
