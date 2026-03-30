package demo.demo_spring.hotdeal.domain;

import demo.demo_spring.product.domain.Product;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.cglib.core.Local;
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

    // 핫딜 이벤트 정보 수정 메서드
    public void updateHotDeal(Integer hotDealPrice, Integer hotDealStock,
                              LocalDateTime startTime, LocalDateTime endTime,
                              HotDealStatus status) {
        // 시간 변경 검증.
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime newStartTime = (startTime != null) ? startTime : this.startTime;
        LocalDateTime newEndTime = (endTime != null) ? endTime : this.endTime;

        if(newStartTime.isBefore(now) || newEndTime.isBefore(now)){ // -> 진행 중인 핫딜 수정 불가하게 추가로 막음
            throw new IllegalStateException("핫딜 시작/종료 시간은 현재보다 이후여야 함");
        }
        if(newEndTime.isBefore(newStartTime)){
            throw new IllegalStateException("핫딜 종료 시간은 시작 시간 이후여야 함");
        }

        // 수정 반영
        if (hotDealPrice != null) this.hotDealPrice = hotDealPrice;
        if (hotDealStock != null) this.hotDealStock = hotDealStock;
        if (startTime != null) this.startTime = startTime;
        if (endTime != null) this.endTime = endTime;
        if (status != null) this.status = status;
    }

    // 핫딜 구매 메서드
    public void buy(int quantity){
        if(quantity <= 0 ){
            throw new IllegalStateException("잘못된 구매 수량");
        }
        if(this.hotDealStock < quantity){
            throw new IllegalStateException("재고 부족");
        }
        this.hotDealStock -=quantity; //구매 성공 + 재고 차감

        if(this.hotDealStock == 0){
            this.status = HotDealStatus.SOLD_OUT; //재고 0 -> 품절처리
        }
    }

    // 핫딜 상태 자동 갱신 메서드
    public void refreshStatus(LocalDateTime now) {
        if (this.hotDealStock == 0) { //재고소진 -> 품절
            this.status = HotDealStatus.SOLD_OUT;
        } else if (now.isBefore(this.startTime)) { //준비
            this.status = HotDealStatus.READY;
        } else if (now.isAfter(this.endTime)) { //종료
            this.status = HotDealStatus.END;
        } else if(now.isEqual(this.endTime)){ //종료시간 딱 겹쳤을 때
            this.status = HotDealStatus.END;
        } else {
            this.status = HotDealStatus.ON_SALE; // 그 외
        }
    }
}
