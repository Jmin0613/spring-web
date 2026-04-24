package demo.demo_spring.cart.dto;

import demo.demo_spring.cart.domain.Cart;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class CartResponse {
    // 장바구니 전체 화면 응답
    private List<CartItemResponse> cartItems;
    private CartSummaryResponse summary;

    private CartResponse(Cart cart, CartSummaryResponse summary){
        // 구매 상품 목록
        this.cartItems = cart.getCartItems()
                .stream()
                .map(CartItemResponse::fromEntity)
                .toList();

        this.summary = summary;
    }

    public static CartResponse of(Cart cart, CartSummaryResponse summary){
        return new CartResponse(cart, summary);
    }

    public static CartResponse empty(){
        CartResponse response = new CartResponse();
        response.cartItems = List.of();
        response.summary = CartSummaryResponse.empty();
        return response;
    }
}
