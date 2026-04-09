package demo.demo_spring.review.service;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.order.domain.OrderItem;
import demo.demo_spring.order.repository.OrderItemRepository;
import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.repository.ProductRepository;
import demo.demo_spring.review.domain.Review;
import demo.demo_spring.review.dto.ReviewCreateRequest;
import demo.demo_spring.review.dto.ReviewListResponse;
import demo.demo_spring.review.dto.ReviewUpdateRequest;
import demo.demo_spring.review.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final MemberService memberService;
    private final OrderItemRepository orderItemRepository;


    public ReviewService(ReviewRepository reviewRepository, ProductRepository productRepository,
                         MemberService memberService, OrderItemRepository orderItemRepository){
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.memberService = memberService;
        this.orderItemRepository = orderItemRepository;
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

        // 업데이트
        review.updateReview(request.getTitle(), request.getContent(), request.getRating());
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
    public List<ReviewListResponse> findAllReview(Long productId){
        productRepository.findById(productId)
                .orElseThrow(()-> new IllegalStateException("리뷰 목록을 조회하려는 상품이 없습니다."));

        return reviewRepository.findAllByProductIdOrderByCreatedAtDesc(productId)
                .stream()
                .map(ReviewListResponse::fromEntity)
                .toList();
    }

    // 주문항목이 로그인 회원것인지 확인하는 메서드
    private void validateOrderItemMatch(OrderItem orderItem, Long memberId){
        Long orderMemberId = orderItem.getOrders().getMember().getId();
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
}
