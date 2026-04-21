package demo.demo_spring.review.domain;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.order.domain.OrderItem;
import demo.demo_spring.product.domain.Product;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY) //OneToOne으로 안하고 ManyToOne + unique제약 + exists 검사
    @JoinColumn(name = "orderItem_id", nullable = false, unique = true)
    private OrderItem orderItem;

    private String productNameSnapshot;
    private Integer rating;
    private String title;
    private String content;
    private int quantity;

    @Column(nullable = false) // null 불가 + 기본값 0
    private int likeCount; //추천 수 저장
    // 추천/취소할 때마다 likeCount 증감 관리해줘야 함.

    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;

    private Review (Member member, Product product,
                    OrderItem orderItem, Integer rating,
                    String title, String content){
        // 핵심 불변조건 검증
        if(product == null){ throw new IllegalStateException("리뷰 작성하시려는 상품이 없습니다.");}
        if(member == null){ throw new IllegalStateException("로그인이 필요합니다."); }

        if(title == null || title.isBlank()){ throw new IllegalStateException("리뷰 제목을 입력해주세요.");}
        if(content == null || content.isBlank()){ throw new IllegalStateException("리뷰 내용을 입력해주세요.");}

        if(rating == null){
            throw new IllegalStateException("별점을 입력해주세요.");
        }else if(rating < 1 || rating > 5) { // 별점 범위 체크
            throw new IllegalStateException("별점은 1~5점 사이여야 합니다.");
        }

        this.member = member; this.product = product; this.orderItem = orderItem;
        this.productNameSnapshot = orderItem.getProductNameSnapshot();
        this.rating = rating; this.title = title; this.content = content;
        this.likeCount = 0; //int 기본값 0이지만, 의도를 표현.
        this.quantity = orderItem.getQuantity();
    }

    // 리뷰 등록/생성 메서드
    public static Review createReview(Member member, Product product,
                                      OrderItem orderItem, Integer rating,
                                      String title, String content){
        return new Review(member, product, orderItem, rating, title, content);
    }

    // 리뷰 수정 메서드
    public void updateReview(String title, String content, Integer rating, LocalDateTime now){
        // 시간 제한 체크
        if(this.createdAt.plusDays(3).isBefore(now)) {
            throw new IllegalStateException("리뷰 수정은 작성일로 부터 3일 이내에만 가능합니다.");
        }

        if (title != null){ // null = 미수정
            if(title.isBlank()){ // blank = 잘못된 입력, 예외
                throw new IllegalStateException("제목을 공백으로 수정할 수 없습니다.");
            } this.title = title;
        }
        if (content != null){
            if(content.isBlank()){
                throw new IllegalStateException("내용을 공백으로 수정할 수 없습니다.");
            } this.content = content;
        }
        if(rating != null){
            if(rating < 1 || rating > 5){ // 별점 범위 체크
                throw new IllegalStateException("별점은 1~5점 사이여야 합니다.");
            }
            this.rating = rating;
        }
    }

    // 리뷰 추천수 증가
    public void increaseLikeCount(){
        this.likeCount++;
    }
    // 리뷰 추천수 감소
    public void decreaseLikeCount(){
        if(this.likeCount<=0){
            throw new IllegalStateException("추천 수는 0보다 작을 수 없습니다.");
        }
        this.likeCount--;
    }
}
