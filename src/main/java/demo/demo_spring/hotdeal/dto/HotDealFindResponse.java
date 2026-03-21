package demo.demo_spring.hotdeal.dto;

import demo.demo_spring.hotdeal.domain.HotDeal;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
// @AllArgsConstructor
public class HotDealFindResponse {
    // 고객에 보여줄 것만 뽑기
    private Long id;
    private String title; //상품 게시글 제목
    private int price; //원래 가격
    private int discountPrice; //핫딜 가격
    private int quantity; // 재고 수량
    private LocalDateTime startTime; //핫딜 시작 시간
    private LocalDateTime endTime; //핫딜 종료 시간

    // hotDeal 생성자
    public HotDealFindResponse(HotDeal hotDeal){
        this.id = hotDeal.getId();
        this.title = hotDeal.getTitle();
        this.price = hotDeal.getPrice();
        this.discountPrice = hotDeal.getDiscountPrice();
        this.quantity = hotDeal.getQuantity();
        this.startTime = hotDeal.getStartTime();
        this.endTime = hotDeal.getEndTime();
    }// 필드로 선언된 것만 lombok이 생성자를 만들어서 값을 넣음
    // HotDeal은 필드가 아니라서 자동 생성이 안됨.

    //Entity ->DTO 변환 메서드
    public static HotDealFindResponse fromEntity(HotDeal hotDeal){
        return new HotDealFindResponse(hotDeal);
    }

    //setter 필요없음.
}
