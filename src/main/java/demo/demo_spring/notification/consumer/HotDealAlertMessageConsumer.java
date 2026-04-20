package demo.demo_spring.notification.consumer;

import demo.demo_spring.notification.config.RabbitMqConfig;
import demo.demo_spring.notification.message.HotDealPreStartAlertMessage;
import demo.demo_spring.notification.service.NotificationService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class HotDealAlertMessageConsumer { //핫딜 알림 메시지를 소비(Consume. 실제로 처리?)하는 클래스
    // producer : 일감을 큐에 넣는 사람
    // consumer는 : 큐에 들어온 일감을 꺼내 실제 작업을 시작시키는 사람
    // 작업은 NotificationService가 진행.

    // consumer가 메세지를 받았을때, 실제로 핫딜 알림 생성 비즈니스 로직을 맡길 서비스
    private final NotificationService notificationService; // 실제 처리는 얘가 하는거임

    public HotDealAlertMessageConsumer(NotificationService notificationService){
        this.notificationService = notificationService;
    }

    // OTDEAL_PRE_START_ALERT_QUEUE(hotdeal.prestart.alert.queue) 를 계속 듣고 있다가
    // 메시지가 들어오면 아래 메서드를 자동으로 실행해라
    @RabbitListener(queues = RabbitMqConfig.HOTDEAL_PRE_START_ALERT_QUEUE)
    public void consumePreStartAlert(HotDealPreStartAlertMessage message){
        // converter덕에, 문자열이 아닌 DTO객체로 메세지를 받음

        notificationService.createHotDealPreStartNotification(message.getHotDealId());
        // 받은 메세지 안에서 hotDealId를 꺼내서, 서비스가 알림 생성하게 넘김.
    }
}
