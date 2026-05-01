package demo.demo_spring.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PaymentCompleteResponse {
    // 주문, 결제 완료 시, 프론트에서 주문 상세 페이지로 이동하기 위한 응답DTO

    private Long orderId;
}
