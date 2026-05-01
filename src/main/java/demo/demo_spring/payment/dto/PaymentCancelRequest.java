package demo.demo_spring.payment.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PaymentCancelRequest {
    //결제 취소 API에서 받을 요청DTO

    private Long orderId; // 취소할 주문 번호
    private String reason; //취소 사유
}
