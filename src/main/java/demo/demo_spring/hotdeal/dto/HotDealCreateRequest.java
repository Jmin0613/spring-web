package demo.demo_spring.hotdeal.dto;


import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class HotDealCreateRequest { // 핫딜 등록시 사용할 요청request DTO

    private Long productId; // product_id. 어떤 Product에 붙는지 알기 위해
    private int hotDealPrice;
    private int hotDealStock;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    /* DTO -> Entity 변환하는 toEntity() 지금 DTO안에서 못 만듦
     저번처럼, DTO 정보만으로 엔티티를 완성하기 어려움
     이번에도 Service와 도메인쪽에 넘기는게 좋아보임.
     1. DTO가 요청값만 들고 있음
     2. 서비스가 productId로 Product를 조회
     3. 조회한 Product를 HotDeal.createHotDeal()에 넘김
     */
}
