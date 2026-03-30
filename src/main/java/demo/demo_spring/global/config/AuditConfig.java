package demo.demo_spring.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration // 스프링에게 설정 클래스로 알려주기
@EnableJpaAuditing
public class AuditConfig {
}
