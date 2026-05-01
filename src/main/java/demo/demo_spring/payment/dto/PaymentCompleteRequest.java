package demo.demo_spring.payment.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PaymentCompleteRequest {
    // 결제창PortOne에서 결제가 끝난뒤PAID, 백엔드 검증 API 보낼 요청DTO

    private Long orderId; // 주문 번호
    private String paymentId; // 결제 번호
}
