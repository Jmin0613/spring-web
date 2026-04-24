package demo.demo_spring.cart.dto;

import demo.demo_spring.order.domain.DeliveryInfo;
import demo.demo_spring.order.dto.DeliveryInfoRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class CartBuyRequest {
    // 주문하기 요청
    @NotNull(message = "구매할 장바구니 항목을 선택해주세요.")
    private List<Long> cartItemIds;

    @Valid //객체를 필드로 가질때는 @Valid해줘야함. @NotBlank는 String에 대해서만 체크임.
    @NotNull(message = "배송 정보를 입력해주세요.")
    private DeliveryInfoRequest deliveryInfo;
} // CartBuyRequest, HotDealBuyRequest, ProductBuyRequest -> OrderCreateRequest로 공통화 리팩토링 생각해보기
