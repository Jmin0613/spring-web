package demo.demo_spring.review.service;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.order.domain.OrderItem;
import demo.demo_spring.order.repository.OrderItemRepository;
import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.repository.ProductRepository;
import demo.demo_spring.review.domain.Review;
import demo.demo_spring.review.domain.ReviewLike;
import demo.demo_spring.review.domain.ReviewSortType;
import demo.demo_spring.review.dto.*;
import demo.demo_spring.review.repository.ReviewLikeRepository;
import demo.demo_spring.review.repository.ReviewRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final MemberService memberService;
    private final OrderItemRepository orderItemRepository;
    private final ReviewLikeRepository reviewLikeRepository;


    public ReviewService(ReviewRepository reviewRepository, ProductRepository productRepository,
                         MemberService memberService, OrderItemRepository orderItemRepository, ReviewLikeRepository reviewLikeRepository){
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.memberService = memberService;
        this.orderItemRepository = orderItemRepository;
        this.reviewLikeRepository = reviewLikeRepository;
    }

    // 리뷰 작성
    public Long create(Long productId, Long memberId,
                       ReviewCreateRequest request){
        // 멤버, 상품 조회
        Member member = memberService.getMember(memberId);
        Product product = productRepository.findById(productId)
                .orElseThrow(()-> new IllegalStateException("리뷰를 작성하시려는 상품이 없습니다."));
        // member는 서비스에서 이미 null체크해서 가져옴. product는 레포지토리에서 바로 꺼내와서 체크 해줘야 함.

        // request.getOrderItemId()로 주문항목 조회
        Long orderItemId = request.getOrderItemId();
        if(orderItemId == null){
            throw new IllegalStateException("리뷰를 작성하시려는 주문상품이 없습니다.");
        }

        OrderItem orderItem = orderItemRepository.findById(orderItemId) //Optional로 꺼내니, null체크
                .orElseThrow(()->new IllegalStateException("주문항목이 없습니다."));

        // 주문항목이 로그인 회원것인지 확인
        validateOrderItemMatch(orderItem, memberId);

        // 주문항목의 상품과 product가 같은지 확인 -> 상품 일치 검증
        if(!orderItem.getProduct().getId().equals(productId)){
            throw new IllegalStateException("구매 상품과 리뷰 작성하시려는 상품이 일치하지않습니다.");
        }

        // 중복 리뷰 확인
        if(reviewRepository.existsByOrderItemId(orderItemId)){ //있음 -> true
            throw new IllegalStateException("이미 리뷰를 작성하였습니다.");
        }

        // 리뷰 생성 + 저장
        Review review = Review.createReview(member, product, orderItem,
                request.getRating(), request.getTitle(), request.getContent());
        Review savedReview = reviewRepository.save(review);
        return savedReview.getId();
    }

    // 리뷰 수정
    public void update(Long productId, Long reviewId, Long memberId,
                       ReviewUpdateRequest request){
        // 리뷰 존재 여부 확인
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(()-> new IllegalStateException("수정하려는 리뷰가 없습니다."));

        // productId와 review 관계 검증
        validateReviewBelongToProduct(productId, review);

        // 작성자 본인 확인
        validateWriter(memberId, review);

        // 시간 제한
        LocalDateTime now = LocalDateTime.now();

        // 업데이트
        review.updateReview(request.getTitle(), request.getContent(), request.getRating(), now);
    }

    // 리뷰 삭제
    public void delete(Long productId, Long reviewId, Long memberId){
        // 리뷰 존재 여부 확인
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(()-> new IllegalStateException("삭제하려는 리뷰가 없습니다."));

        // productId와 review 관계 검증
        validateReviewBelongToProduct(productId, review);

        // 작성자 본인 확인
        validateWriter(memberId, review);

        // 삭제
        reviewRepository.delete(review);

    }

    // 리뷰 조회 목록
    public ReviewPageResponse findAllReview(Long productId, ReviewSortType sort,
                                            Integer rating, int page, int size){
        // 요청한 정렬/별점/페이지 조건이 유효한지 검사
        validateReviewSearchCondition(rating, page, size);

        // 통과하면 페이지 번호, 크기를 바탕으로 DB 조회 조건 객체 생성
        Pageable pageable = PageRequest.of(page, size);

        // 조건 객체(정령방식, 별점필터)에 맞는 리뷰 페이지 조회
        Page<Review> reviewPage = getReviewPage(productId, sort, rating, pageable);

        // 현재페이지에 들어있는 Review 목록 꺼내서
        // ReviewListResponse목록으로 변환
        List<ReviewListResponse> reviews = reviewPage.getContent()
                // reviewPage.getContent() -> 현재 페이지에 해당하는 리뷰 목록만 꺼냄
                .stream()
                .map(ReviewListResponse::fromEntity)
                .toList();

        // productId로 해당 리뷰 통계 생성
        ReviewSummaryResponse summary = findReviewSummary(productId);

        // "리뷰 통계 + 현재 페이지 리뷰 목록 + 페이지 정보"
        return ReviewPageResponse.of(summary, reviews, reviewPage); // 묶어서 응답DTO 생성 후 반환
    }

    // 리뷰 추천
    public ReviewLikeToggleResponse likeToggle(Long productId, Long reviewId, Long memberId){
        // 멤버 조회
        Member member = memberService.getMember(memberId);
        // 리뷰 존재 여부 확인
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(()-> new IllegalStateException("추천하시려는 리뷰가 없습니다."));

        // 해당 상품 리뷰가 맞는지, productId와 review 관계 검증
        validateReviewBelongToProduct(productId, review);

        // 현재 추천 상태 확인, 이미 추천했는지 조회
        Optional<ReviewLike> reviewLike = reviewLikeRepository.findByMemberIdAndReviewId(memberId, reviewId);

        if(reviewLike.isPresent()){ // 이미 추천했으면(있으면) delete + likeCount 감소 + liked = false 반환
            reviewLikeRepository.delete(reviewLike.get());
            review.decreaseLikeCount();
            return new ReviewLikeToggleResponse(reviewId, false, review.getLikeCount());

        } else{ // 없으면 save + likeCount 증가 + liked = true 반환
            reviewLikeRepository.save(ReviewLike.create(member, review));
            review.increaseLikeCount();
            return new ReviewLikeToggleResponse(reviewId, true, review.getLikeCount());
        }

    }

    // 주문항목이 로그인 회원것인지 확인하는 메서드
    private void validateOrderItemMatch(OrderItem orderItem, Long memberId){
        Long orderMemberId = orderItem.getOrder().getMember().getId();
        if(!orderMemberId.equals(memberId)){
            throw new IllegalStateException("리뷰 작성 권한이 없습니다.");
        }
    }

    // ProductId와 ReviewId 관계 검증 메서드
    private void validateReviewBelongToProduct(Long productId, Review review){
        if(!review.getProduct().getId().equals(productId)){
            throw new IllegalStateException("해당 상품에 대한 리뷰가 아닙니다.");
        }
    }

    // 작성자 본인 확인 메서드
    private void validateWriter(Long memberId, Review review){
        if(!memberId.equals(review.getMember().getId())){
            throw new IllegalStateException("리뷰 작성자 본인이 아닙니다.");
        }
    }

    // 별점, 페이지 유효성 검사 메서드
    private void validateReviewSearchCondition(Integer rating, int page, int size){
        if(rating != null && (rating < 1 || rating > 5)){
            throw new IllegalStateException("별점 필터는 1~5점 사이만 가능합니다.");
        }
        if(page < 0){
            throw new IllegalStateException("페이지 번호는 0 이상이어야 합니다.");
        }
        if(size < 1){
            throw new IllegalStateException("페이지 크기는 1 이상이어야 합니다.");
        }
        if(size > 50){
            throw new IllegalStateException("페이지 크기는 50 이하만 가능합니다.");
        }
    }

    // 요청받은 정렬방식+별점필터 조건에 맞는 리뷰 페이지 조회하는 메서드
    private Page<Review> getReviewPage(Long productId, ReviewSortType sort,
                                       Integer rating, Pageable pageable){
        // 최신순
        if (sort == ReviewSortType.LATEST) {
            if (rating == null) { // 별점필터 X -> 전체 별점
                return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable);
            }

            // 별점필터 O
            return reviewRepository.findByProductIdAndRatingOrderByCreatedAtDesc(
                    productId, rating, pageable
            );
        }

        // 추천순 sort == ReviewSortType.BEST
        if (rating == null) { // 별점필터 X -> 전체 별점
            return reviewRepository.findByProductIdOrderByLikeCountDescCreatedAtDesc(
                    productId, pageable
            );
        }
        // 별점필터 O
        return reviewRepository.findByProductIdAndRatingOrderByLikeCountDescCreatedAtDesc(
                productId, rating, pageable
        );
    }

    // 리뷰 통계 계산 메서드
    public ReviewSummaryResponse findReviewSummary(Long productId) {
        // 해당 상품의 총 리뷰 수
        Long totalCount = reviewRepository.countByProductId(productId);

        // 평균 별점
        Double averageRating = reviewRepository.findAverageRatingByProductId(productId);
        if (averageRating == null) { // 별점 없을 경우
            averageRating = 0.0;
        } else{ // 별점있다면 소수점 1자리까지 반올림
            averageRating = BigDecimal.valueOf(averageRating)
                    .setScale(1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        // 각 별점 별 리뷰 수
        Long fiveStarCount = reviewRepository.countByProductIdAndRating(productId, 5);
        Long fourStarCount = reviewRepository.countByProductIdAndRating(productId, 4);
        Long threeStarCount = reviewRepository.countByProductIdAndRating(productId, 3);
        Long twoStarCount = reviewRepository.countByProductIdAndRating(productId, 2);
        Long oneStarCount = reviewRepository.countByProductIdAndRating(productId, 1);

        return ReviewSummaryResponse.of(
                averageRating, totalCount,
                fiveStarCount, fourStarCount, threeStarCount,
                twoStarCount, oneStarCount
        );
    }
}
