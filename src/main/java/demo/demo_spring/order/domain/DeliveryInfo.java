package demo.demo_spring.order.domain;

import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable // 엔티티 내부에 포함될 수 있게 선언
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DeliveryInfo {
    private String receiverName;
    private String phoneNumber;
    private String address;
    private String deliveryMemo;

    // 생성자 -> 값 변경 불가, 불변 객체
    public DeliveryInfo(String receiverName, String phoneNumber, String address, String deliveryMemo){
        // 최소검증
        if(receiverName == null || receiverName.isBlank()){
            throw new IllegalStateException("받는 사람이 비어있습니다.");
        }
        if (phoneNumber == null || phoneNumber.isBlank()){
            throw new IllegalStateException("연락처가 비어있습니다.");
        }
        if(address == null || address.isBlank()){
            throw new IllegalStateException("주소가 비어있습니다.");
        }

        this.receiverName = receiverName; this.phoneNumber = phoneNumber;
        this.address = address; this.deliveryMemo = deliveryMemo;
    }

}
