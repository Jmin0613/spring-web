package demo.demo_spring.hotdeal.dto;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.domain.HotDealStatus;
import lombok.Getter;

import java.time.*;

@Getter
public class HotDealDetailResponse {
    // 사용자 핫딜 상세 응답 response DTO

    private Long hotDealId;
    private Long productId;

    private String productName;
    private String imageUrl;
    private String detailImageUrl;
    private String description;

    private int originalPrice;
    private int hotDealPrice;
    private int discountRate;
    private int hotDealStock;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private HotDealStatus status;

    private boolean alertSubscribed; // 알림 신청 여부

    //HotDeal 생성자 -> fromEntity()가 내부에서 호출할 생성자
    private HotDealDetailResponse(HotDeal hotDeal, boolean alertSubscribed, int currentHotDealStock){
        this.hotDealId = hotDeal.getId();
        this.productId = hotDeal.getProduct().getId();
        this.productName = hotDeal.getProduct().getName(); this.imageUrl = hotDeal.getProduct().getImageUrl();
        this.originalPrice = hotDeal.getProduct().getPrice(); this.hotDealPrice = hotDeal.getHotDealPrice();
        this.startTime = hotDeal.getStartTime(); this.endTime = hotDeal.getEndTime();
        this.status = hotDeal.getStatus();
        this.description = hotDeal.getProduct().getDescription();
        this.hotDealStock = currentHotDealStock;
        this.discountRate = hotDeal.calculateDiscountRate();
        this.alertSubscribed = alertSubscribed;
        this.detailImageUrl = hotDeal.getProduct().getDetailImageUrl();
    }

    //엔티티 -> DTO
    public static HotDealDetailResponse fromEntity(HotDeal hotDeal, boolean alertSubscribed, int currentHotDealStock) {
        return new HotDealDetailResponse(hotDeal, alertSubscribed, currentHotDealStock);
    }
    // 레거시
    public static HotDealDetailResponse fromEntity(HotDeal hotDeal) {
        return new HotDealDetailResponse(hotDeal, false, hotDeal.getHotDealStock());
    }

}
