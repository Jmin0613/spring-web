package demo.demo_spring.mypage.dto;

import demo.demo_spring.order.domain.DeliveryStatus;
import demo.demo_spring.order.domain.OrderStatus;
import demo.demo_spring.order.domain.Orders;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Getter
public class MyPageOrderListResponse {
    // 주문 묶음 DTO - 주문 자체 정보

    private Long orderId;
    private LocalDateTime orderDate;
    private OrderStatus orderStatus;
    private DeliveryStatus deliveryStatus;
    private List<MyPageOrderItemResponse> orderItems; //order의 orderItem 카드들 리스트

    private MyPageOrderListResponse(Orders order, Set<Long> reviewedOrderItemIds){
        // 이미 리뷰 작성된 orderItemId목록에 특정id있는지 확인하기 위해 Set<E>
        this.orderId = order.getId(); this.orderDate = order.getOrderDate();
        this.orderStatus = order.getOrderStatus(); this.deliveryStatus = order.getDeliveryStatus();

        this.orderItems = order.getOrderItems()
                .stream()
                .map(orderItem -> { //각 주문상품 orderItem마다
                    boolean reviewed = reviewedOrderItemIds.contains(orderItem.getId()); //id가 리뷰 작성된 id목록에 있는지 확인
                    return MyPageOrderItemResponse.fromEntity(orderItem, reviewed); // 있으면 true, 없으면 false
                })
                .toList();
    }

    public static MyPageOrderListResponse fromEntity(Orders order, Set<Long> reviewedOrderItemIds){
        return new MyPageOrderListResponse(order, reviewedOrderItemIds);
    }

    //기존 코드 호환용
    public static MyPageOrderListResponse fromEntity(Orders order){
        return new MyPageOrderListResponse(order, Set.of()); //비어있는 set
    }
}
