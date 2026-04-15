package demo.demo_spring.hotdeal.dto;


import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class HotDealCreateRequest {
    // 핫딜 등록시 사용할 요청request DTO

    @NotNull(message = "핫딜의 원본 상품을 입력해주세요.")
    private Long productId;

    @NotNull(message = "핫딜 가격 입력은 필수입니다.")
    @Positive(message = "핫딜 가격은 1 이상이어야 합니다.")
    private Integer hotDealPrice;

    @NotNull(message = "핫딜 수량 입력은 필수입니다.")
    @Positive(message = "핫딜 수량은 1 이상이어야 합니다.")
    private Integer hotDealStock;

    @NotNull(message = "핫딜 시작시간을 입력해주세요.")
    private LocalDateTime startTime;
    @NotNull(message = "핫딜 종료시간을 입력해주세요.")
    private LocalDateTime endTime;
}
