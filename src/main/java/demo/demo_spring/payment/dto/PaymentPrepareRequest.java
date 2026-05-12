package demo.demo_spring.payment.dto;

import demo.demo_spring.order.domain.PaymentMethod;
import demo.demo_spring.order.dto.DeliveryInfoRequest;
import demo.demo_spring.payment.domain.PaymentOrderType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class PaymentPrepareRequest {
    // 프론트(결제 준비 API)에서 백엔드로 보내는 요청DTO

    private PaymentOrderType paymentOrderType;
    /*
         orderType따라서 필요한 값이 달라짐
         PRODUCT_DIRECT → productId + quantity
         HOTDEAL_DIRECT → hotDealId + quantity
         CART → cartItemIds
    */

    //PRODUCT_DIRECT or HOTDEAL_DIRECT
    private Long productId;
    private Long hotDealId;
    private Integer quantity;

    //CART
    private List<Long> cartItemIds;

    private PaymentMethod paymentMethod;

    // 배송정보
    @Valid
    @NotNull(message = "배송 정보를 입력해주세요.")
    private DeliveryInfoRequest deliveryInfo;
}
