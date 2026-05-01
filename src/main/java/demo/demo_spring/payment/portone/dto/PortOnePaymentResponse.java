package demo.demo_spring.payment.portone.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true) //PortOne응답에 당장 안쓰는 필드 많을 수 있어서 에러 안나게.
public class PortOnePaymentResponse {
    //PortOne 결제 조회 응답DTO (포트원 -> 백)

    private String id; //PortOne 결제 id -> paymentId와 대응
    private String status; //PortOne 기준 결제 상태 (PAID, FAILED, READY, CANCELLED)
    private Amount amount; //PortOne에서 결제된 총 금액

    // 외부클래스와 내부클래스 둘 다 따로 어노테이션 걸어주기.
    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Amount {
        private int total;
    }
    //PortOne서버가 amount를 {total, current, discount 등등}넣어서 객체로 묶어 보내기 때문에
    // 받을때도 구조를 맞춰서 받기 위해 내부 클래스 만듦.
    // amount -> 결제 금액에 대한 정보 "묶음"
}
