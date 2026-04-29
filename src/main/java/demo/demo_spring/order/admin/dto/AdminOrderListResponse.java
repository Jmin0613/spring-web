package demo.demo_spring.order.admin.dto;

import demo.demo_spring.order.domain.DeliveryStatus;
import demo.demo_spring.order.domain.OrderStatus;
import demo.demo_spring.order.domain.Orders;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class AdminOrderListResponse {
    // 관리자 주문관리 -> 주문목록 카드 응답 DTO

    private Long orderId; //주문 번호
    private LocalDateTime orderDate; //주문 날짜

    private OrderStatus orderStatus; //주문 상태
    private DeliveryStatus deliveryStatus; //배송 상태

    private Long memberId; //구매자 id
    private String memberLoginId; //구매자 로그인 아이디
    private String memberName; //구매자 이름
    private String memberNickName; //구매자 빅네임

    private int totalPrice; //총 구매금액/결제금액
    private int itemCount; //주문 상품 종류 수/주문 항목 수

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
