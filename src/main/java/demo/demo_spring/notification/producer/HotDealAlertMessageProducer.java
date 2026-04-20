package demo.demo_spring.notification.producer;

import demo.demo_spring.notification.config.RabbitMqConfig;
import demo.demo_spring.notification.message.HotDealPreStartAlertMessage;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class HotDealAlertMessageProducer { //핫딜 알림 작업을 RabbitMQ로 보내는 역할
    // 스케쥴러가 해당 hotDealId는 시작 10분전이니 알림을 보내야한다 판단을하면
    // 프로듀서는 그 hotDealId를 바로 NotificationService로 넘기는 대신, RabbitMQ에 메세지로 넣어둠.
    // 그럼 나중에 consumer가 그 메세지를 꺼내서 실제 알림 생성 작업을 진행.
    // 즉, producer는 "일 시켜야 할 대상을 큐에 넣는 사람"

    private final RabbitTemplate rabbitTemplate; // RabbitMQ로 메세지 보내는 도구

    public HotDealAlertMessageProducer(RabbitTemplate rabbitTemplate){
        this.rabbitTemplate = rabbitTemplate;
    }

    // 실제로 메세지 보내는 메서드 -> hotDealId에 대한 핫딜 시작 전 알림 작업을 큐에 발행.
    public void publishPreStartAlert(Long hotDealId){
        // 메세지 DTO 객체 생성
        HotDealPreStartAlertMessage message =
                new HotDealPreStartAlertMessage(hotDealId);

        // 객체를 적절한 메세지 형태로 변환하여, RabbitMQ로 보내기
        rabbitTemplate.convertAndSend(
                // message 변환하고 -> exchange로 보내고 -> routing key기준으로 -> queue로 전달

                RabbitMqConfig.HOTDEAL_PRE_START_ALERT_EXCHANGE, // exchange
                RabbitMqConfig.HOTDEAL_PRE_START_ALERT_ROUTING_KEY, // routingKey
                message // HotDealPreStartAlertMessage(hotDealId). message
                // 이 message를 이 exchange에 전달하는데, routing key는 이거야!!!
        );
    }
}
