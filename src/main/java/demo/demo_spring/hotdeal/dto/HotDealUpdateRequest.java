package demo.demo_spring.hotdeal.dto;

import demo.demo_spring.hotdeal.domain.HotDealStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class HotDealUpdateRequest {
    // 핫딜 상품 정보 업데이트할떄 사용할 DTO

    //update에서는 DTO를 엔티티로 새로 만드는 게 아니라
    //기존 엔티티에 DTO 값을 덮어써야 함.

    private Integer hotDealPrice; //부분 수정시, 값을 안넣으면 int는 0이 들어갈 수 있음
    private Integer hotDealStock;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private HotDealStatus status;
}
