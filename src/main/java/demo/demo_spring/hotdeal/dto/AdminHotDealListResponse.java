package demo.demo_spring.hotdeal.dto;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.domain.HotDealStatus;
import lombok.Getter;

import java.time.*;

@Getter
public class AdminHotDealListResponse {
    // 관리자 목록 응답response DTO

    private Long hotDealId;
    private Long productId;
    private String productName;
    private String imageUrl;

    private int originalPrice;
    private int hotDealPrice;
    private int discountRate;
    private int hotDealStock;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime createdAt;
    private HotDealStatus status;

    // hotDeal 생성자 -> fromEntity()가 내부에서 호출할 생성자
    private AdminHotDealListResponse(HotDeal hotDeal, int currentHotDealStock){
        this.hotDealId = hotDeal.getId(); this.productId = hotDeal.getProduct().getId();
        this.productName = hotDeal.getProduct().getName();
        this.originalPrice = hotDeal.getOriginalPrice(); this.hotDealPrice = hotDeal.getHotDealPrice();
        this.hotDealStock = currentHotDealStock;
        this.startTime = hotDeal.getStartTime(); this.endTime = hotDeal.getEndTime();
        this.createdAt = hotDeal.getCreatedAt();
        this.status = hotDeal.getStatus();
        this.discountRate = hotDeal.calculateDiscountRate();
        this.imageUrl = hotDeal.getProduct().getImageUrl();

    }

    //Entity -> DTO 변환 메서드
    public static AdminHotDealListResponse fromEntity(HotDeal hotDeal, int currentHotDealStock){
        return new AdminHotDealListResponse(hotDeal, currentHotDealStock);
    }
    // 레거시
    public static AdminHotDealListResponse fromEntity(HotDeal hotDeal){
        return new AdminHotDealListResponse(hotDeal, hotDeal.getHotDealStock());
    }
}
