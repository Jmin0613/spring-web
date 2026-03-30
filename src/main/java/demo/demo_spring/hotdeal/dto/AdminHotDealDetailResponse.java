package demo.demo_spring.hotdeal.dto;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.domain.HotDealStatus;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AdminHotDealDetailResponse {
    // 관리자 핫딜 상세 응답 response

    private Long hotDealId;
    private Long productId;

    private String name;
    private String description;
    private String imageUrl;

    private int price;
    private int hotDealPrice;
    private int hotDealStock;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private HotDealStatus status;

    //HotDeal 생성자 -> fromEntity()가 내부에서 호출할 생성자
    private AdminHotDealDetailResponse(HotDeal hotDeal){
        this.hotDealId = hotDeal.getId(); this.productId = hotDeal.getProduct().getId();
        this.name = hotDeal.getProduct().getName();
        this.description = hotDeal.getProduct().getDescription();
        this.imageUrl = hotDeal.getProduct().getImageUrl();
        this.price = hotDeal.getProduct().getPrice(); this.hotDealPrice = hotDeal.getHotDealPrice();
        this.hotDealStock = hotDeal.getHotDealStock();
        this.startTime = hotDeal.getStartTime(); this.endTime = hotDeal.getEndTime();
        this.createdAt = hotDeal.getCreatedAt(); this.updatedAt = hotDeal.getUpdatedAt();
        this.status = hotDeal.getStatus();
    }

    //Entity ->DTO 변환 메서드
    public static AdminHotDealDetailResponse fromEntity(HotDeal hotDeal) {
        return new AdminHotDealDetailResponse(hotDeal);
    }
}
