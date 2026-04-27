package demo.demo_spring.mypage.dto;

import demo.demo_spring.order.domain.OrderItem;
import lombok.Getter;

@Getter
public class MyPageOrderItemResponse {
    // 주문 상품 카드 DTO - 화면에 한 줄씩 보일 상품 정보

    private Long orderItemId;
    private Long productId;

    private String productNameSnapshot;
    private String imageUrlSnapshot;

    private int orderPrice;
    private int quantity;
    private int itemTotalPrice;

    private boolean reviewed; // 리뷰 작성 여부

    private MyPageOrderItemResponse(OrderItem orderItem, boolean reviewed){
        this.orderItemId = orderItem.getId(); this.productId = orderItem.getProduct().getId();
        this.productNameSnapshot = orderItem.getProductNameSnapshot(); this.imageUrlSnapshot = orderItem.getProduct().getImageUrl();
        this.orderPrice = orderItem.getOrderPrice(); this.quantity = orderItem.getQuantity();
        this.itemTotalPrice = orderItem.getTotalPrice();
        this.reviewed = reviewed;
    }

    // 주문목록 리뷰여부를 위해 사용
    public static MyPageOrderItemResponse fromEntity(OrderItem orderItem, boolean reviewed){
        return new MyPageOrderItemResponse(orderItem,reviewed);
    }
}
