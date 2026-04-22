package demo.demo_spring.hotdeal.dto;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.domain.HotDealStatus;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class HotDealListResponse {
    // 사용자 목록 응답response DTO
    // 그동안과 다른점. 그동안의 응답 dto는 해당 엔티티 하나만을 바라보았다면,
    // 이번 응답dto는 hotDeal이 참조하고 있는 연관 엔티티인 Product까지 보고 꺼내와야 함.

    private Long hotDealId; //핫딜 고유 id
    private Long productId; //원본 상품 고유 id
    private String productName;
    private String imageUrl; //대표 이미지

    private int originalPrice; //원가격
    private int hotDealPrice; //핫딜 가격
    private int discountRate; //할인율

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private HotDealStatus status;

    // hotDeal 생성자 -> fromEntity()가 내부에서 호출할 생성자
    private HotDealListResponse(HotDeal hotDeal){
        this.hotDealId = hotDeal.getId();
        // 응답DTO는 연관관계를 따라가서 필요한 값 꺼내올 수 있음.
        this.productName = hotDeal.getProduct().getName(); this.imageUrl = hotDeal.getProduct().getImageUrl();
        this.originalPrice = hotDeal.getProduct().getPrice(); this.hotDealPrice = hotDeal.getHotDealPrice();
        this.startTime = hotDeal.getStartTime(); this.endTime = hotDeal.getEndTime();
        this.status = hotDeal.getStatus();
        this.discountRate = hotDeal.calculateDiscountRate();
        this.productId = hotDeal.getProduct().getId();
    }

    // Entity ->DTO 변환 메서드
    public static HotDealListResponse fromEntity(HotDeal hotDeal){
        return new HotDealListResponse(hotDeal);
    }
}
