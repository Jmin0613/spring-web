package demo.demo_spring.order.admin.dto;

import demo.demo_spring.order.domain.DeliveryStatus;
import demo.demo_spring.order.domain.OrderStatus;
import demo.demo_spring.order.domain.Orders;
import lombok.Getter;

import java.time.*;
import java.util.List;

@Getter
public class AdminOrderListResponse {
    // 관리자 주문관리 -> 주문목록 카드 응답 DTO

    private Long orderId;
    private LocalDateTime orderDate;

    private OrderStatus orderStatus; //주문 상태
    private DeliveryStatus deliveryStatus; //배송 상태

    private Long memberId;
    private String memberLoginId;
    private String memberName;
    private String memberNickName;

    private int totalPrice; //총 구매금액
    private int itemCount; //주문상품 항목 수

    //Order 생성자 -> fromEntity()가 내부에서 호출할 생성자
    private AdminOrderListResponse(Orders order){
        this.orderId = order.getId(); this.orderDate = order.getOrderDate();
        this.orderStatus = order.getOrderStatus(); this.deliveryStatus = order.getDeliveryStatus();

        this.memberId = order.getMember().getId(); this.memberLoginId = order.getMember().getLoginId();
        this.memberName = order.getMember().getName(); this.memberNickName = order.getMember().getNickName();

        this.totalPrice = order.getTotalPrice(); this.itemCount = order.getOrderItems().size();
    }

    //엔티티 -> DTO
    public static AdminOrderListResponse fromEntity(Orders order){
        return new AdminOrderListResponse(order);
    }

}
