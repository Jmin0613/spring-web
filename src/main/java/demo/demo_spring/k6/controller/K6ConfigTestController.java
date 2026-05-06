package demo.demo_spring.k6.controller;

import com.zaxxer.hikari.HikariDataSource;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Profile("k6")
@RestController
@RequestMapping("/test/config")
@RequiredArgsConstructor
public class K6ConfigTestController {
    // hikari 튜닝 적용 확인용

    private final HikariDataSource hikariDataSource;

    @GetMapping("/hikari")
    public Map<String, Object> getHikariConfig(){
        return Map.of(
                "maximumPoolSize", hikariDataSource.getMaximumPoolSize(),
                "minimumIdle", hikariDataSource.getMinimumIdle(),
                "connectionTimeout", hikariDataSource.getConnectionTimeout()
        );
    }
}
