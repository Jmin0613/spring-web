package demo.demo_spring.notification.message;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
// 서버가 만들기만 하는 DTO가 아니라, 보내고 다시 복원되는 DTO라서 둘 다 필요. -> 보내는 쪽도 있고, 받는 쪽도 있고.
public class HotDealPreStartAlertMessage {
    private Long hotDealId;

}
