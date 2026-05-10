package demo.demo_spring.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class HotDealAlertToggleResponse {
    private boolean subscribed;
}
