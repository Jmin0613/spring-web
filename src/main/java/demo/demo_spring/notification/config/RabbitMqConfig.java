package demo.demo_spring.notification.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration // RabbitMQ에서 메세지를 어디로 보낼지 길을 먼저 깔아두는 설정 클래스
public class RabbitMqConfig {

    // "hotdeal.prestart.alert.*" -> RabbitMQ 안에서 실제로 쓰이는 이름표
    // 다른 곳에서 재사용가능성 + 추후 이름변경 등을 위해, 상수로 뺴기.
    public static final String HOTDEAL_PRE_START_ALERT_QUEUE = "hotdeal.prestart.alert.queue";
    // 핫딜 시작 전 알림 메세지가 실제로 쌓이는 통
    public static final String HOTDEAL_PRE_START_ALERT_EXCHANGE = "hotdeal.prestart.alert.exchange";
    // 메세지 받았을 때, 이 메세지를 어느 큐로 보낼지 판단하는 분배기
    public static final String HOTDEAL_PRE_START_ALERT_ROUTING_KEY = "hotdeal.prestart.alert";
    // 익스체인지가 메세지를 큐로 보낼 때 어디로 보낼지 쓰는 주소표

    @Bean
    public Queue hotDealPreStartAlertQueue(){
        //Queue : 메세지 쌓이는 곳
        return new Queue(HOTDEAL_PRE_START_ALERT_QUEUE);
    }

    @Bean
    public DirectExchange hotDealPreStartAlertExchange(){
        //DirectExchange : 메세지를 어디로 보낼지 분배하는 곳. routing key 보고 보냄.
        //Routing Key : exchange가 queue로 보낼 때 쓰는 주소표 같은 것

        //producer는 보통 메세지를 큐에 직접 꽂아넣는게 아니라, 먼저 exchange에게 메세지를 보냄.
        // 그러면 exchange가 "이 메세지를 어느 queue로 보내야 하는지" 확인하고 보냄.
        return new DirectExchange(HOTDEAL_PRE_START_ALERT_EXCHANGE);
    }

    @Bean
    public Binding hotDealPreStartAlertBinding() {
        //Binding : queue와 exchange를 연결
        // queue랑 exchange를 만들기만 하면 안되고, "어떤 routing key로 온 메세지를, 어떤 queue로 보낼지"를 연결해야함.
        return BindingBuilder
                .bind(hotDealPreStartAlertQueue())
                .to(hotDealPreStartAlertExchange())
                .with(HOTDEAL_PRE_START_ALERT_ROUTING_KEY);
        // hotdeal.prestart.alert.exchange로 들어온 메시지 중
        // routing key가 hotdeal.prestart.alert인 메시지는
        // hotdeal.prestart.alert.queue로 보내라
    }

    @Bean
    public MessageConverter jsonMessageConverter(){
        //MessageConvert : 메시지를 어떤 형태로 바꿔서 보낼지/받을지 담당하는 변환기
        // RabbitMQ는 내부적으로 바이트/메세지 데이터로 다루기 때문에, 객체를 그대로 못 보냄
        // 근데 메세지를 그냥 문자열이 아니라 객체로 보낼려고 함
        // 그래서 중간에서 변환이 필요
        // 그걸 해주는 것이 converter
        // -> 자바 객체와 JSON 메시지 사이를 변환해주는 도구

        return new JacksonJsonMessageConverter();
        //자바 객체를 JSON으로 바꿔서 보내고, 받은 JSON을 다시 자바 객체로 바꿔라
    }
}
