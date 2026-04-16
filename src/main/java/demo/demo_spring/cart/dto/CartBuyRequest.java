package demo.demo_spring.cart.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class CartBuyRequest {
    @NotNull(message = "구매할 장바구니 항목을 선택해주세요.")
    private List<Long> cartItemIds;
}
