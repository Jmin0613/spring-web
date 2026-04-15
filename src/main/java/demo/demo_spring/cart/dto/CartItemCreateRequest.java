package demo.demo_spring.cart.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CartItemCreateRequest {
    @NotNull(message = "장바구니 수량 입력은 필수입니다.")
    @Positive(message = "장바구니 수량은 1 이상이어야 합니다.")
    private Integer quantity;
}
