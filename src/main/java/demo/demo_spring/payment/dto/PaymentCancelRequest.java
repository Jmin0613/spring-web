package demo.demo_spring.payment.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PaymentCancelRequest {
    //결제 취소 API에서 받을 요청DTO

    private Long orderId;
    private String reason;
}
