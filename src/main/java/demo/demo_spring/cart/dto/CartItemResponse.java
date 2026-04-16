package demo.demo_spring.cart.dto;

import demo.demo_spring.cart.domain.CartItem;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class CartItemResponse {
    private Long cartItemId;
    private Long productId;

    private String productName;
    private String imageUrl;

    private int price;
    private int quantity;
    private int totalPrice;

    private LocalDateTime createdAt;

    private CartItemResponse(CartItem cartItem){
        this.cartItemId = cartItem.getId(); this.productId = cartItem.getProduct().getId();
        this.productName = cartItem.getProduct().getName(); this.imageUrl = cartItem.getProduct().getImageUrl();
        this.price = cartItem.getProduct().getPrice(); this.quantity = cartItem.getQuantity();
        this.totalPrice = calculateItemTotalPrice();
    }

    // itemTotalPrice 계산 메서드
    private int calculateItemTotalPrice(){
        return this.price * this.quantity;
    }

    public static CartItemResponse fromEntity(CartItem cartItem){
        return new CartItemResponse(cartItem);
    }
}
