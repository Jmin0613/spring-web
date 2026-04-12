package demo.demo_spring.mypage.dto;

import demo.demo_spring.order.domain.OrderItem;
import lombok.Getter;

@Getter
public class MyPageOrderItemResponse {
    // 주문 상품 카드 DTO - 화면에 한 줄씩 보일 상품 정보

    private Long orderItemId;
    private Long productId;

    private String productName;
    private String imageUrl; // 현재 상품 이미지url. 나중에 주문 당시 이미지 snapshot으로 변경하기 (리팩토링)

    private int orderPrice;
    private int quantity;
    private int itemTotalPrice;

    private MyPageOrderItemResponse(OrderItem orderItem){
        this.orderItemId = orderItem.getId(); this.productId = orderItem.getProduct().getId();
        this.productName = orderItem.getProductNameSnapshot(); this.imageUrl = orderItem.getProduct().getImageUrl();
        this.orderPrice = orderItem.getOrderPrice(); this.quantity = orderItem.getQuantity();
        this.itemTotalPrice = orderItem.getTotalPrice();
    }

    public static MyPageOrderItemResponse fromEntity(OrderItem orderItem){
        return new MyPageOrderItemResponse(orderItem);
    }
}
