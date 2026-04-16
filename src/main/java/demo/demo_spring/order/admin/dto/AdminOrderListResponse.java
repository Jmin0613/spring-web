package demo.demo_spring.order.admin.dto;

import demo.demo_spring.order.domain.DeliveryStatus;
import demo.demo_spring.order.domain.OrderStatus;
import demo.demo_spring.order.domain.Orders;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AdminOrderListResponse {
    private Long orderId; //주문 번호
    private LocalDateTime orderDate; //주문 날짜

    private OrderStatus orderStatus; //주문 상태
    private DeliveryStatus deliveryStatus; //배송 상태

    private String memberName; //구매자 이름
    private String memberLoginId; //구매자 로그인 아이디

    private int totalPrice; //총 구매금액/결제금액
    private int itemCount; //주문 상품 종류 수/주문 항목 수

    private String representativeProductName; //대표 상품 이름

    //Order 생성자 -> fromEntity()가 내부에서 호출할 생성자
    private AdminOrderListResponse(Orders order){
        this.orderId = order.getId(); this.orderDate = order.getOrderDate();
        this.orderStatus = order.getOrderStatus(); this.deliveryStatus = order.getDeliveryStatus();
        this.totalPrice = order.getTotalPrice(); this.itemCount = order.getOrderItems().size();
        this.representativeProductName = order.getOrderItems().getFirst().getProductNameSnapshot();
        this.memberName = order.getMember().getName(); this.memberLoginId = order.getMember().getLoginId();
    }

    //엔티티 -> DTO
    public static AdminOrderListResponse fromEntity(Orders order){
        return new AdminOrderListResponse(order);
    }

}
