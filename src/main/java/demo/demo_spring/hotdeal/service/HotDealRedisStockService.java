package demo.demo_spring.hotdeal.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Service;

@Service
public class HotDealRedisStockService {
    private final StringRedisTemplate stringRedisTemplate;

    public HotDealRedisStockService(StringRedisTemplate stringRedisTemplate){
        this.stringRedisTemplate = stringRedisTemplate;
    }

    // key -> hotdeal:stock:{hotDealId} = hotdeal:stock:3
    private String stockKey(Long hotDealId){
        return "hotdeal:stock:" + hotDealId;
    }


    // 초기 재고 세팅
    public void setStock(Long hotDealId, int stock){
        // key 만들기
        String key = stockKey(hotDealId);
        String value = Integer.toString(stock);

        // value 저장
        ValueOperations<String, String> redisStocks = stringRedisTemplate.opsForValue();
        redisStocks.set(key, value);

    }

    // 현재 재고 가져오기
    public int getStock(Long hotDealId){
        // key 만들기
        String key = stockKey(hotDealId);

        // value 조회
        ValueOperations<String, String> redisStocks = stringRedisTemplate.opsForValue();
        String value = redisStocks.get(key);

        // null 체크
        if(value == null){
            throw new IllegalStateException("Redis에 핫딜 재고가 세팅되지 않았습니다.");
        }

        // int 변환 후 반환
        return Integer.parseInt(value);
    }

    // 재고 차감 성공/실패 -> 재고 충분한지 확인 후 차감해야함.
    public boolean decreaseStock(Long hotDealId, int quantity){
        // 현재 재고 조회 -> null이면 예외 or 0 취급
        int stock = getStock(hotDealId);

        // 현재 재고 < 요청 수량 이면 false
        if(stock < quantity){
            return false; // 실패
        }

        // 아니면 재고 감소시키고
        int updatedStock = stock - quantity;
        // 다시 저장 후 true 반환
        setStock(hotDealId, updatedStock);
        return true;
    }

    // 실패 시 복구
    public void increaseStock(Long hotDealId, int quantity){
        // 현재 재고 조회
        int stock = getStock(hotDealId);

        // 변경할 재고 = 현재 재고 + quantity
        int updatedStock = stock + quantity;

        // 다시 Redis에 저장
        setStock(hotDealId, updatedStock);

    }

    // 종료 후 Redis에 적재된 재고 삭제
    public void deleteStock(Long hotDealId){
        // key 만들기
        String key = stockKey(hotDealId);

        // 데이터 삭제
        stringRedisTemplate.delete(key);
    }

}
