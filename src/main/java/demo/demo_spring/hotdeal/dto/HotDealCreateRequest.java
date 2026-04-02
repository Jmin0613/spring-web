package demo.demo_spring.hotdeal.dto;


import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class HotDealCreateRequest {
    // 핫딜 등록시 사용할 요청request DTO

    private Long productId; // product_id. 어떤 Product에 붙는지 알기 위해
    private int hotDealPrice;
    private int hotDealStock;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
