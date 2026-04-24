package demo.demo_spring.cart.dto;

import demo.demo_spring.cart.domain.Cart;
import demo.demo_spring.cart.domain.CartItem;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CartSummaryResponse {
    // 가격 요약 전용 DTO

    private int totalQuantity; //장바구니 담긴 총 상품 개수
    private int totalProductPrice; // 장바구니 담긴 총 상품 가격
    private int discountAmount; //할인 금액
    private int shippingFee; //배송비
    private int finalPrice; //최종 결제금액

    private CartSummaryResponse(Cart cart) {
        this.totalQuantity = cart.getCartItems()
                .stream()
                .filter(CartItem::isSelected) //구매 여부 체크된 것만 필터링
                .mapToInt(CartItem::getQuantity)
                .sum();

        this.totalProductPrice = cart.getCartItems()
                .stream()
                .filter(CartItem::isSelected)
                .mapToInt(cartItems -> cartItems.getQuantity() * cartItems.getProduct().getPrice())
                .sum();

        this.discountAmount = 0; // 현재 할인 기능X. 추후 확장 고려.

        // 총 상품가격 20000원 이상 -> 무료배송. (아니면 3000원)
        this.shippingFee = totalProductPrice >= 20000 ? 0 : 3000;
        this.finalPrice = totalProductPrice - discountAmount + shippingFee;
    }

    public static CartSummaryResponse fromEntity(Cart cart){
        return new CartSummaryResponse(cart);
    }

    public static CartSummaryResponse empty(){
        CartSummaryResponse response = new CartSummaryResponse();

        response.totalQuantity=0; response.totalProductPrice=0;
        response.discountAmount=0; response.shippingFee=0;
        response.finalPrice=0;
        return response;
    }

}
