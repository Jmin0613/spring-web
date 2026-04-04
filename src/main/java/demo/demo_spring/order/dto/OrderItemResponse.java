package demo.demo_spring.order.dto;

import demo.demo_spring.order.domain.OrderItem;
import lombok.Getter;

@Getter
public class OrderItemResponse {
    private Long productId;
    private String productName;
    private int orderPrice;
    private int quantity;

    //OrderItem 생성자 -> -> fromEntity()가 내부에서 호출할 생성자
    private OrderItemResponse(OrderItem orderItem){
        this.productId = orderItem.getProduct().getId();
        this.productName = orderItem.getProductName();
        this.orderPrice = orderItem.getOrderPrice();
        this.quantity = orderItem.getQuantity();
    }
    //엔티티 -> DTO
    public static OrderItemResponse fromEntity(OrderItem orderItem){ return new OrderItemResponse(orderItem);}
}
