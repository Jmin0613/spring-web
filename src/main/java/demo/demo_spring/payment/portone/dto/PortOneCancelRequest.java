package demo.demo_spring.payment.portone.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PortOneCancelRequest {
    // PortOne 결제 취소CANCEL 요청DTO (백 -> 포트원)

    private String reason;
}
