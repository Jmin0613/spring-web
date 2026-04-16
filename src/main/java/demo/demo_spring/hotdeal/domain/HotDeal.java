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
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class HotDeal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; //server hotdeal id

    @ManyToOne(fetch = FetchType.LAZY) // HotDeal은 Product에 속해있음.
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private int originalPrice;
    private int hotDealPrice;
    private int hotDealStock;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    private HotDealStatus status;

    private HotDeal (Product product, int hotDealPrice, int hotDealStock,
                     LocalDateTime startTime, LocalDateTime endTime, LocalDateTime now){
        // 불변조건 null 체크
        if(product == null){
            throw new IllegalStateException("등록하려는 핫딜의 원본 상품이 없습니다.");
        }
        if(startTime == null || endTime == null){
            throw new IllegalStateException("핫딜 시작/종료 시간을 입력해주세요.");
        }
        if(now == null){
            throw new IllegalStateException("현재 시간이 누락되었습니다.");
        }

        // 시간 불변조건 검증
        if(startTime.isBefore(now)||endTime.isBefore(now)){
            throw new IllegalStateException("핫딜 시작은 현재 이후여야 합니다.");
        }
        if(endTime.isBefore(startTime) || endTime.isEqual(startTime)){
            throw new IllegalStateException("핫딜 종료는 시작시간보다 뒤여야 합니다.");
        }

        // 가격/수량 불변조건 검증
        if (hotDealPrice < 1){
            throw new IllegalStateException("잘못된 가격을 입력하였습니다.");
        }
        if (hotDealStock < 1){
            throw new IllegalStateException("잘못된 수량을 입력하였습니다.");
        }

        this.product = product; this.hotDealPrice = hotDealPrice; this.hotDealStock = hotDealStock;
        this.startTime = startTime; this.endTime = endTime;
        this.status = HotDealStatus.READY;
        this.originalPrice = product.getPrice();
    }

    // 핫딜 이벤트 등록/생성 메서드
    public static HotDeal createHotDeal(Product product, int hotDealPrice, int hotDealStock,
                                        LocalDateTime startTime, LocalDateTime endTime, LocalDateTime now){
        HotDeal hotDeal = new HotDeal(product, hotDealPrice,hotDealStock, startTime, endTime, now);

        // Product에 재공 할당 요청
        product.allocateToHotDeal(hotDealStock); //통과되면 재고 차감

        return hotDeal;
    }

    // 핫딜 이벤트 정보 수정 메서드
    public void updateHotDeal(Integer hotDealPrice, Integer hotDealStock,
                              LocalDateTime startTime, LocalDateTime endTime
                              ) { //HotDealStatus status
        LocalDateTime now = LocalDateTime.now(); // 시간 변경 검증
        LocalDateTime newStartTime = (startTime != null) ? startTime : this.startTime;
        LocalDateTime newEndTime = (endTime != null) ? endTime : this.endTime;

        if(newStartTime.isBefore(now) || newEndTime.isBefore(now)){ // -> 진행 중인 핫딜 수정 불가
            throw new IllegalStateException("핫딜 진행 중 수정 불가.");
        }
        if(newEndTime.isBefore(newStartTime)){
            throw new IllegalStateException("핫딜 종료 시간은 시작 시간 이후여야 함");
        }

        if (hotDealPrice != null) this.hotDealPrice = hotDealPrice;
        if (startTime != null) this.startTime = startTime;
        if (endTime != null) this.endTime = endTime;

        // 재고 차이값 처리 (현재 핫딜 재고this.hotDealStock vs 새로 입력된 핫딜 재고hotDealStock)
        if (hotDealStock != null){
            if (hotDealStock < 1){
                throw new IllegalStateException("수정될 핫딜의 재고값은 0보다 높아야 합니다.");
                //update에서는 hotDealStock을 1 이상만 허용
                //재고를 0으로 만들고 싶으면 STOPPED 또는 delete로 별도 처리하기
            }
            if(this.hotDealStock<hotDealStock){ // 새 > 기존 -> 재고 꺼내오기
                int diff = hotDealStock-this.hotDealStock;
                product.allocateToHotDeal(diff);
            }
            else if (this.hotDealStock>hotDealStock){ // 새 < 기존 -> 재고 돌려주기
                int diff = this.hotDealStock-hotDealStock;
                product.restoreStock(diff);
            }
            else { // 새 == 기존
                return;
            }
            this.hotDealStock = hotDealStock;
        }
    }

    // 핫딜 구매 메서드
    public void buy(int quantity){
        if(this.status == HotDealStatus.STOPPED){
            throw new IllegalStateException("판매 중단된 핫딜입니다.");
        }
        else if(this.status == HotDealStatus.END){
            throw new IllegalStateException("판매 종료된 핫딜입니다.");
        }
        else if(this.status == HotDealStatus.READY){
            throw new IllegalStateException("아직 준비 중인 핫딜입니다.");
        } else { //ON_SALE
            if (quantity <= 0) {
                throw new IllegalStateException("잘못된 구매 수량입니다.");
            }
            if (this.hotDealStock < quantity) {
                throw new IllegalStateException("재고가 부족합니다.");
            }
            this.hotDealStock -= quantity; //구매 성공 + 재고 차감

            if (this.hotDealStock == 0) {
                this.status = HotDealStatus.SOLD_OUT; //재고 0 -> 품절처리
            }
        }
    }

    // 핫딜 상태 자동 갱신 메서드
    public void refreshStatus(LocalDateTime now) {
        // 판매 시간보고 ON_SALE로 변경되지 않게 return
        if(this.status == HotDealStatus.STOPPED){
            return;
        }

        if (this.hotDealStock == 0) { //재고소진 -> 품절
            this.status = HotDealStatus.SOLD_OUT;
        } else if (now.isBefore(this.startTime)) { //준비
            this.status = HotDealStatus.READY;
        } else if (now.isAfter(this.endTime) || now.isEqual(this.endTime)) { //종료
            returnRemainingStockToProduct(); //남은 재고 반환 후 상태변경
            this.status = HotDealStatus.END;
        } else { //그 외
            this.status = HotDealStatus.ON_SALE;
        }
    }

    // 남은 핫딜 재고 반환 메서드
    public void returnRemainingStockToProduct(){
        if (this.hotDealStock < 0){
            throw new IllegalStateException("남은 핫딜 재고 반환 중 문제가 발생하였습니다.");
        }
        if (this.hotDealStock == 0){
            return;
        }
        product.restoreStock(hotDealStock);
        this.hotDealStock = 0;
    }

    // 관리자 긴급 중단 메서드 -> 핫딜 자신의 상태와 재고를 바꾸는 것이기에 도메인에 넣음.
    public void adminEmergencyStop(){
        // 이미 STOPPED면 그냥 return
        if (this.status == HotDealStatus.STOPPED){
            return;
        }
        if (this.status == HotDealStatus.SOLD_OUT){
            throw new IllegalStateException("이미 재고 소진된 핫딜 상품입니다.");
        }
        if (this.status == HotDealStatus.END){
            throw new IllegalStateException("이미 판매 종료된 핫딜 상품입니다.");
        }

        // status를 STOPPED로 변경
        this.status = HotDealStatus.STOPPED;
    }

    // 관리자 중단 재개 메서드
    public void adminResume(LocalDateTime now){
        // STOPPED 체크
        if(this.status != HotDealStatus.STOPPED){
            throw new IllegalStateException("중지된 핫딜만 재개할 수 있습니다.");
        }
        // endTime 체크
        if(!now.isBefore(this.endTime)){
            throw new IllegalStateException("종료 시간이 지난 핫딜은 재개할 수 없습니다.");
        }
        // 시작전이면 READY, 재고 반환X
        if(now.isBefore(this.startTime)){
            this.status = HotDealStatus.READY;
        } else{
            this.status = HotDealStatus.ON_SALE;
        }
    }

    // 할인율 계산 메서드 -> 파생값. 추후 필드 선언 고려
    public int calculateDiscountRate(){
        if(originalPrice <= 0){ //원하 0 이하 체크
            throw new IllegalStateException("잘못된 원가입니다.");
        }
        double rate = ((double) (originalPrice-hotDealPrice)/originalPrice)*100;
        return (int) Math.round(rate); //반올림하여 정수로 반환
    }
}
