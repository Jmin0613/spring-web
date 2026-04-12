package demo.demo_spring.order.dto;

import demo.demo_spring.order.domain.OrderStatus;
import demo.demo_spring.order.domain.Orders;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class OrderDetailResponse {
    private Long orderId; //주문 번호
    private LocalDateTime orderDate; //주문 날짜
    private OrderStatus status; //주문 상태 (완료 or 취소)
    private int totalPrice; //총 구매금액/결제금액

    private List<OrderItemResponse> orderItems; // 상품목록

    //Order 생성자 -> -> fromEntity()가 내부에서 호출할 생성자
    private  OrderDetailResponse(Orders orders){
        this.orderId = orders.getId(); this.orderDate = orders.getOrderDate();
        this.status = orders.getStatus(); this.totalPrice = orders.getTotalPrice();

        this.orderItems = orders.getOrderItems()
                .stream()
                // 각 OrderItem을 OrderItemResponse로 변환
                .map(OrderItemResponse::fromEntity)
                //변환한 DTO로 리스트 채우기
                .toList();
    }

    //엔티티 -> DTO
    public static OrderDetailResponse fromEntity(Orders orders){ return new OrderDetailResponse(orders);}
}
