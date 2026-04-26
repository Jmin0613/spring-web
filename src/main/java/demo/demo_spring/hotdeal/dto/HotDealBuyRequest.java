package demo.demo_spring.hotdeal.dto;

import demo.demo_spring.order.domain.DeliveryInfo;
import demo.demo_spring.order.domain.PaymentMethod;
import demo.demo_spring.order.dto.DeliveryInfoRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class HotDealBuyRequest {
    @NotNull(message = "구매 수량 입력은 필수입니다.")
    @Positive(message = "구매 수량은 1 이상이어야 합니다.")
    private Integer quantity;

    @Valid
    @NotNull(message = "배송 정보를 입력해주세요.")
    private DeliveryInfoRequest deliveryInfo;

    @NotNull(message = "결제수단을 선택해 주세요.")
    private PaymentMethod paymentMethod;
}
