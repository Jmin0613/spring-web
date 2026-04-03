package demo.demo_spring.order.dto;

import demo.demo_spring.order.domain.OrderStatus;
import demo.demo_spring.order.domain.Orders;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class OrderListResponse {
    private Long orderId; //주문 번호
    private LocalDateTime orderDate; //주문 날짜
    private OrderStatus status; //주문 상태 (완료 or 취소)
    private int totalPrice; //총 구매금액/결제금액

    //Order 생성자 -> fromEntity()가 내부에서 호출할 생성자
    private OrderListResponse(Orders orders){
        this.orderId = orders.getId(); this.orderDate = orders.getOrderedAt();
        this.status = orders.getStatus(); this.totalPrice = orders.getTotalPrice();
    }

    //엔티티 -> DTO
    public static OrderListResponse fromEntity(Orders orders){
        return new OrderListResponse(orders);
    }

}
