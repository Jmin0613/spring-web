package demo.demo_spring.hotdeal.dto;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.domain.HotDealStatus;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AdminHotDealListResponse {
    // 관리자 목록 응답response DTO -> 운영상태를 한눈에 보기 위함

    private Long hotDealId;
    private Long productId;
    // 운영/관리 용도이니, productId 추가
    // 어떤 상품에 붙은 핫딜인지 식별, 나중에 상품 상세/수정 연결 용이, db나 운영 관점에서 추적 쉬움
    private String procutName;

    private int originalPrice;
    private int hotDealPrice;
    private int discountRate;
    private int hotDealStock;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime createdAt;
    private HotDealStatus status;

    // hotDeal 생성자 -> fromEntity()가 내부에서 호출할 생성자
    private AdminHotDealListResponse(HotDeal hotDeal){
        this.hotDealId = hotDeal.getId(); this.productId = hotDeal.getProduct().getId();
        this.procutName = hotDeal.getProduct().getName();
        this.originalPrice = hotDeal.getOriginalPrice(); this.hotDealPrice = hotDeal.getHotDealPrice();
        this.hotDealStock = hotDeal.getHotDealStock();
        this.startTime = hotDeal.getStartTime(); this.endTime = hotDeal.getEndTime();
        this.createdAt = hotDeal.getCreatedAt();
        this.status = hotDeal.getStatus();
        this.discountRate = hotDeal.calculateDiscountRate();

    }

    //Entity -> DTO 변환 메서드
    public static AdminHotDealListResponse fromEntity(HotDeal hotDeal){
        return new AdminHotDealListResponse(hotDeal);
    }
}
