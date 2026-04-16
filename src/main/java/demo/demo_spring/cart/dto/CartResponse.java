package demo.demo_spring.cart.dto;

import demo.demo_spring.cart.domain.Cart;
import demo.demo_spring.cart.domain.CartItem;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class CartResponse {
    private Integer totalQuantity;
    private Integer totalPrice;
    private List<CartItemResponse> cartItems;

    private CartResponse(Cart cart){
        // 구매 상품 목록
        this.cartItems = cart.getCartItems()
                .stream()
                .map(CartItemResponse::fromEntity)
                .toList();

        // 구매 총 수량
        this.totalQuantity = cart.getCartItems()
                .stream()
                .mapToInt(CartItem::getQuantity)
                .sum();

        // 구매 총 가격
        this.totalPrice = cart.getCartItems()
                .stream()
                .mapToInt(cartItems->cartItems.getQuantity() * cartItems.getProduct().getPrice())
                .sum();

    }

    public static CartResponse fromEntity(Cart cart){ return new CartResponse(cart); }

    public static CartResponse empty(){
        CartResponse response = new CartResponse();
        response.totalQuantity = 0; response.totalPrice = 0;
        response.cartItems = List.of();
        return response;
    }
}
