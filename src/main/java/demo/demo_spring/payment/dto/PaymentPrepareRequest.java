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
    // orderType따라서 필요한 값이 달라짐
    // PRODUCT_DIRECT → productId + quantity
    // HOTDEAL_DIRECT → hotDealId + quantity
    // CART → cartItemIds

    //PRODUCT_DIRECT일때
    private Long productId;

    //HOTDEAL_DIRECT일떄
    private Long hotDealId;

    // PRODUCT_DIRECT or HOTDEAL_DIRECT일떄
    private Integer quantity;

    //CART일때
    private List<Long> cartItemIds;

    private PaymentMethod paymentMethod;

    // 배송정보
    @Valid
    @NotNull(message = "배송 정보를 입력해주세요.")
    private DeliveryInfoRequest deliveryInfo;
    // 배송정보 필드 중복x. 또한 기존 주문 흐름과 결제 준비 흐름이 같은 배송dto사용.
    // 그로인해, 나중에 배송정보 필드가 바뀌어도 한 곳만 수정하면 됨. 굿.

}
