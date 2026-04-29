package demo.demo_spring.order.admin.dto;

import demo.demo_spring.order.domain.DeliveryStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AdminOrderDeliveryStatusUpdateRequest {
    // 관리자 배송상태 변경 DTO

    private DeliveryStatus deliveryStatus;
}
