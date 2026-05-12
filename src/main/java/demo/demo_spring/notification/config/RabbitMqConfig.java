package demo.demo_spring.notification.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    // "hotdeal.prestart.alert.*" -> RabbitMQ 안에서 실제로 쓰이는 이름표

    // 핫딜 시작 전 알림 메세지가 실제로 쌓이는 통
    public static final String HOTDEAL_PRE_START_ALERT_QUEUE = "hotdeal.prestart.alert.queue";

    // 메세지 받았을 때, 이 메세지를 어느 큐로 보낼지 판단하는 분배기
    public static final String HOTDEAL_PRE_START_ALERT_EXCHANGE = "hotdeal.prestart.alert.exchange";

    // 익스체인지가 메세지를 큐로 보낼 때 어디로 보낼지 쓰는 주소표
    public static final String HOTDEAL_PRE_START_ALERT_ROUTING_KEY = "hotdeal.prestart.alert";

    @Bean
    public Queue hotDealPreStartAlertQueue(){
        return new Queue(HOTDEAL_PRE_START_ALERT_QUEUE);
    }

    @Bean
    public DirectExchange hotDealPreStartAlertExchange(){
        return new DirectExchange(HOTDEAL_PRE_START_ALERT_EXCHANGE);
    }

    @Bean
    public Binding hotDealPreStartAlertBinding() {
        return BindingBuilder
                .bind(hotDealPreStartAlertQueue())
                .to(hotDealPreStartAlertExchange())
                .with(HOTDEAL_PRE_START_ALERT_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter(){
        return new JacksonJsonMessageConverter();
    }
}
