package demo.demo_spring.mypage.dto;

import demo.demo_spring.order.domain.DeliveryInfo;
import demo.demo_spring.order.domain.DeliveryStatus;
import demo.demo_spring.order.domain.OrderStatus;
import demo.demo_spring.order.domain.Orders;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class MyPageOrderDetailResponse {
    private Long orderId;
    private LocalDateTime orderDate;
    private OrderStatus orderStatus;
    private DeliveryStatus deliveryStatus;
    private int totalPrice;
    private List<MyPageOrderItemResponse> orderItems; // DTO 재사용

    private DeliveryInfo deliveryInfo;

    private MyPageOrderDetailResponse(Orders order){
        this.orderId = order.getId(); this.orderDate = order.getOrderDate();
        this.orderStatus = order.getOrderStatus(); this.deliveryStatus = order.getDeliveryStatus();
        this.totalPrice = order.getTotalPrice();

        this.orderItems = order.getOrderItems()
                .stream()
                //.map(MyPageOrderItemResponse::fromEntity)
                .map(orderItem -> MyPageOrderItemResponse.fromEntity(orderItem, false))
                // 주문상세에서 reviewed쓸 일 없으니 일단 이렇게 두고, 나중에 유지보수 고려.
                .toList();

        this.deliveryInfo = order.getDeliveryInfo();
    }


    public static MyPageOrderDetailResponse fromEntity(Orders order){ return new MyPageOrderDetailResponse(order);}

}
