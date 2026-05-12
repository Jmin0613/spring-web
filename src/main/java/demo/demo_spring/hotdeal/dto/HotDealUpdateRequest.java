package demo.demo_spring.hotdeal.dto;

import demo.demo_spring.hotdeal.domain.HotDealStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.*;

@Getter
@NoArgsConstructor
public class HotDealUpdateRequest {
    // 핫딜 상품 정보 업데이트할떄 사용할 DTO

    private Integer hotDealPrice; //부분 수정시, int로 0이 들어가는 것 막기
    private Integer hotDealStock;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private HotDealStatus status;
}
