package demo.demo_spring.mypage.dto;

import demo.demo_spring.order.domain.OrderStatus;
import demo.demo_spring.order.domain.Orders;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class MyPageOrderListResponse {
    // 주문 묶음 DTO - 주문 자체 정보

    private Long orderId;
    private LocalDateTime orderDate;
    private OrderStatus status;
    private List<MyPageOrderItemResponse> items; //order의 orderItem 카드들 리스트

    private MyPageOrderListResponse(Orders order){
        this.orderId = order.getId(); this.orderDate = order.getOrderDate();
        this.status = order.getStatus();
        this.items = order.getOrderItems()
                .stream()
                .map(MyPageOrderItemResponse::fromEntity)
                .toList();
    }

    public static MyPageOrderListResponse fromEntity(Orders order){
        return new MyPageOrderListResponse(order);
    }
}
