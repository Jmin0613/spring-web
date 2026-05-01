package demo.demo_spring.order.dto;

import demo.demo_spring.order.domain.DeliveryInfo;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class DeliveryInfoRequest {
    @NotBlank(message = "받는 사람을 입력해주세요.")
    private String receiverName; //받는 사람
    @NotBlank(message = "연락처를 입력해주세요.")
    private String phoneNumber; //연락처 contact
    @NotBlank(message = "배송지를 입력해주세요.")
    private String address; //배송 주소

    private String deliveryMemo; //배송 메모

    //PaymentPrepareRequest에서 재사용 위해 필요 객체 변환
    public DeliveryInfo toDeliveryInfo(){
        return new DeliveryInfo(receiverName, phoneNumber, address, deliveryMemo);
    }
}
