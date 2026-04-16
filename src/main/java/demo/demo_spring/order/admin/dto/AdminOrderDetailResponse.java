package demo.demo_spring.order.admin.dto;

import demo.demo_spring.order.domain.DeliveryStatus;
import demo.demo_spring.order.domain.OrderStatus;
import demo.demo_spring.order.domain.Orders;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class AdminOrderDetailResponse {
    private Long orderId; //주문 번호
    private LocalDateTime orderDate; //주문 날짜

    private OrderStatus orderStatus; //주문 상태
    private DeliveryStatus deliveryStatus; //배송 상태

    private String memberName; //구매자 이름
    private String memberLoginId; //구매자 로그인 아이디
    private String memberEmail; // 구매자 이메일

    private int totalPrice; //총 구매금액/결제금액
    private List<AdminOrderItemResponse> orderItems; // 상품목록

    //Order 생성자 -> -> fromEntity()가 내부에서 호출할 생성자
    private AdminOrderDetailResponse(Orders order){
        this.orderId = order.getId(); this.orderDate = order.getOrderDate();
        this.orderStatus = order.getOrderStatus(); this.deliveryStatus = order.getDeliveryStatus();
        this.memberName = order.getMember().getName(); this.memberLoginId = order.getMember().getLoginId();
        this.memberEmail = order.getMember().getEmail();
        this.totalPrice = order.getTotalPrice();

        this.orderItems = order.getOrderItems()
                .stream()
                // 각 OrderItem을 OrderItemResponse로 변환
                .map(AdminOrderItemResponse::fromEntity)
                //변환한 DTO로 리스트 채우기
                .toList();
    }

    //엔티티 -> DTO
    public static AdminOrderDetailResponse fromEntity(Orders order){ return new AdminOrderDetailResponse(order);}
}
