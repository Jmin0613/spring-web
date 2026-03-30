package demo.demo_spring.hotdeal.domain;

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
@Entity // db테이블과 연결된 객체라고 선언! db랑 매핑되는 객체.
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class HotDeal {

    @Id //DB의 기본키(PK)를 매칭해주는 어노테이션
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // DB auto increment 방식으로 생성 명시
    private Long id; //server hotdeal id

    @ManyToOne // HotDeal은 Product에 속해있음.
    @JoinColumn(name = "product_id", nullable = false)
    //DB테이블에서 product_id라는 컬럼을 통해 상품 테이블과 연결
    private Product product; // db -> product_id

    private int hotDealPrice; //가격
    private int hotDealStock; //재고

    private LocalDateTime startTime; //핫딜 시작 시간
    private LocalDateTime endTime; //핫딜 종료 시간

    @CreatedDate // 생성시간 자동
    private LocalDateTime createdAt; // 등록시간
    @LastModifiedDate // 수정시간 자동
    private LocalDateTime updatedAt; // 수정시간

    @Enumerated(EnumType.STRING)
    private HotDealStatus status; //핫딜 상태

    // 기본 생성자 -> @NoArgsConstructor

    // 핫딜 이벤트 생성자
    private HotDeal (Product product, int hotDealPrice, int hotDealStock,
                     LocalDateTime startTime, LocalDateTime endTime){
        // createdAt, updatedAt은 Auditing으로 넣어줄 것

        this.product = product; this.hotDealPrice = hotDealPrice; this.hotDealStock = hotDealStock;
        this.startTime = startTime; this.endTime = endTime;
        this.status = HotDealStatus.READY;
    }

    // 핫딜 이벤트 등록/생성 메서드
    public static HotDeal createHotDeal(Product product, int hotDealPrice, int hotDealStock,
                                        LocalDateTime startTime, LocalDateTime endTime){
        // 생성하기 전, 간단한 검증 추가
        if (hotDealPrice <=0){
            throw new IllegalStateException("잘못된 가격 입력");
        }
        if (hotDealStock <=0){
            throw new IllegalStateException("잘못된 수량 입력");
        }
        if(endTime.isBefore(startTime)){
            throw new IllegalStateException("핫딜 진행 시간 오류");
        }

        return new HotDeal(
                product, hotDealPrice,hotDealStock, startTime, endTime
        );
    }
}
