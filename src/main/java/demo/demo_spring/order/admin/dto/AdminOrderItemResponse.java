package demo.demo_spring.order.admin.dto;

import demo.demo_spring.order.domain.OrderItem;
import lombok.Getter;

@Getter
public class AdminOrderItemResponse {
    private Long orderItemId;
    private Long productId;
    private String productName;

    private int orderPrice;
    private int quantity;
    private int itemTotalPrice;

    //OrderItem 생성자 -> -> fromEntity()가 내부에서 호출할 생성자
    private AdminOrderItemResponse(OrderItem orderItem){
        this.orderItemId = orderItem.getId();
        this.productId = orderItem.getProduct().getId();
        this.productName = orderItem.getProductNameSnapshot();
        this.orderPrice = orderItem.getOrderPrice();
        this.quantity = orderItem.getQuantity();
        this.itemTotalPrice = orderItem.getTotalPrice();
    }

    //엔티티 -> DTO
    public static AdminOrderItemResponse fromEntity(OrderItem orderItem){ return new AdminOrderItemResponse(orderItem);}
}
