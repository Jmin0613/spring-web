package demo.demo_spring.hotdeal.dto;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.domain.HotDealStatus;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class HotDealDetailResponse {
    // 사용자 핫딜 상세 응답 response DTO

    private Long hotDealId; //핫딜 고유 id
    private String name;
    private String imageUrl; //대표 이미지
    private int price; //원가격
    private int hotDealPrice;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private HotDealStatus status;

    // 상세 추가
    private String description;
    private int hotDealStock; //핫딜은 한정수량 느낌 강함 -> 남은 재고 보여주기

    //HotDeal 생성자 -> fromEntity()가 내부에서 호출할 생성자
    private HotDealDetailResponse(HotDeal hotDeal){
        this.hotDealId = hotDeal.getId();
        // 응답DTO는 연관관계를 따라가서 필요한 값 꺼내올 수 있음.
        this.name = hotDeal.getProduct().getName(); this.imageUrl = hotDeal.getProduct().getImageUrl();
        this.price = hotDeal.getProduct().getPrice(); this.hotDealPrice = hotDeal.getHotDealPrice();
        this.startTime = hotDeal.getStartTime(); this.endTime = hotDeal.getEndTime();
        this.status = hotDeal.getStatus();
        this.description = hotDeal.getProduct().getDescription(); this.hotDealStock = hotDeal.getHotDealStock();
    }

    //엔티티 -> DTO
    public static HotDealDetailResponse fromEntity(HotDeal hotDeal) {
        return new HotDealDetailResponse(hotDeal);
    }

}
