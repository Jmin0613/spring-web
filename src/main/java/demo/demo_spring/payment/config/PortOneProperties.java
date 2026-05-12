package demo.demo_spring.payment.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "portone") //설정파일에 적힌 "portone"(특정)덩어리들을 가져와라.
public class PortOneProperties {
    // application-local.properties 읽어오기 -> portone.api-secret, portone.store-id

    private String apiSecret;
    private String storeId;
}
