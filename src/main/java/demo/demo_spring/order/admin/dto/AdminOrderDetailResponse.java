package demo.demo_spring.order.admin.dto;

import demo.demo_spring.order.domain.DeliveryStatus;
import demo.demo_spring.order.domain.OrderStatus;
import demo.demo_spring.order.domain.Orders;
import lombok.Getter;

import java.time.*;
import java.util.List;

@Getter
public class AdminOrderDetailResponse {

    private Long orderId;
    private LocalDateTime orderDate;

    private OrderStatus orderStatus; //주문 상태
    private DeliveryStatus deliveryStatus; //배송 상태

    // 보내는 사람
    private String memberName;
    private String memberLoginId;
    private String memberEmail;

    // 받는 사람
    private String receiverName;
    private String phoneNumber;
    private String address;
    private String deliveryMemo;

    private int totalPrice; //총 구매금액
    private List<AdminOrderItemResponse> orderItems; // 상품목록

    //Order 생성자 -> -> fromEntity()가 내부에서 호출할 생성자
    private AdminOrderDetailResponse(Orders order){
        this.orderId = order.getId(); this.orderDate = order.getOrderDate();
        this.orderStatus = order.getOrderStatus(); this.deliveryStatus = order.getDeliveryStatus();
        this.memberName = order.getMember().getName(); this.memberLoginId = order.getMember().getLoginId();
        this.memberEmail = order.getMember().getEmail();
        this.totalPrice = order.getTotalPrice();

        this.receiverName = order.getDeliveryInfo().getReceiverName();
        this.phoneNumber = order.getDeliveryInfo().getPhoneNumber();
        this.address = order.getDeliveryInfo().getAddress();
        this.deliveryMemo = order.getDeliveryInfo().getDeliveryMemo();

        this.orderItems = order.getOrderItems()
                .stream()
                // 각 OrderItem을 OrderItemResponse로 변환
                .map(AdminOrderItemResponse::fromEntity)
                .toList();
    }

    //엔티티 -> DTO
    public static AdminOrderDetailResponse fromEntity(Orders order){ return new AdminOrderDetailResponse(order);}
}
