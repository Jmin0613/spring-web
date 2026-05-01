package demo.demo_spring.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor // 응답 필드 단순 + 단순 결과 반환
public class PaymentPrepareResponse {
    // 결제 준비READY 끝나면 프론트에 보내줄 값

    private Long orderId; // 주문 번호

    private String paymentId; // PortOne에 넘길 결제 고유 ID. (결제번호)

    private String orderName; // PortOne 결제창에 표시할 주문명

    private int totalAmount; // 서버가 계산한 최종 결제금액

}
