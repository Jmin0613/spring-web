package demo.demo_spring.mypage.dto;

import demo.demo_spring.order.domain.OrderStatus;
import demo.demo_spring.order.domain.Orders;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class MyPageOrderDetailResponse {
    private Long orderId;
    private LocalDateTime orderDate;
    private OrderStatus status;
    private int totalPrice;
    private List<MyPageOrderItemResponse> orderItems; // DTO 재사용

    private MyPageOrderDetailResponse(Orders order){
        this.orderId = order.getId(); this.orderDate = order.getOrderDate();
        this.status = order.getStatus(); this.totalPrice = order.getTotalPrice();

        this.orderItems = order.getOrderItems()
                .stream()
                .map(MyPageOrderItemResponse::fromEntity)
                .toList();
    }

    public static MyPageOrderDetailResponse fromEntity(Orders order){ return new MyPageOrderDetailResponse(order);}

}
