package demo.demo_spring.redis;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.assertj.core.api.Assertions.assertThat;


@SpringBootTest
public class RedisConnectionTest {
    // redis와 스프링 연결확인을 위한 테스트

    private final StringRedisTemplate stringRedisTemplate;

    @Autowired
    public RedisConnectionTest(StringRedisTemplate stringRedisTemplate){
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @Test
    public void redisConnectionStepTest(){
        // 1. 준비 (key, value 설정)
        String key = "test:key";
        String value = "hello";

        ValueOperations<String, String> ops = stringRedisTemplate.opsForValue();

        // 2. 저장
        ops.set(key, value);

        // 3. 조회 및 검증
        String result = ops.get(key);
        System.out.println("조회된 결과 : " + result);
        assertThat(result).isEqualTo(value);

        // 데이터 삭제
        stringRedisTemplate.delete(key);
    }

}