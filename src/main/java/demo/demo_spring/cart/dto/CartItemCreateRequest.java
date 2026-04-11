package demo.demo_spring.cart.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CartItemCreateRequest {
    private Integer quantity;
}
