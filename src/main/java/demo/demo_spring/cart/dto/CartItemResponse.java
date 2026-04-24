package demo.demo_spring.cart.dto;

import demo.demo_spring.cart.domain.CartItem;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class CartItemResponse {
    // 장바구니 상품 1개 정보
    private Long cartItemId;
    private Long productId;

    private String productName;
    private String imageUrl;

    private int price; // 상품 1개 가격
    private int quantity; // 담은 수량
    private int totalPrice; // 해당 상품의 price * quantity
    private int shippingFee; //해당 상품의 배송비

    private LocalDateTime createdAt;

    private boolean selected; //구매 선택 여부

    private CartItemResponse(CartItem cartItem){
        this.cartItemId = cartItem.getId(); this.productId = cartItem.getProduct().getId();
        this.productName = cartItem.getProduct().getName(); this.imageUrl = cartItem.getProduct().getImageUrl();
        this.price = cartItem.getProduct().getPrice(); this.quantity = cartItem.getQuantity();
        this.totalPrice = calculateItemTotalPrice();
        this.shippingFee = 3000; // 배송비 현재 3000원 통일.
        this.selected = cartItem.isSelected();
    }

    // itemTotalPrice 계산 메서드
    private int calculateItemTotalPrice(){
        return this.price * this.quantity;
    }

    public static CartItemResponse fromEntity(CartItem cartItem){
        return new CartItemResponse(cartItem);
    }
}
