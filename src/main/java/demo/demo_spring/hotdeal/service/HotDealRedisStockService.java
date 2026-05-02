package demo.demo_spring.hotdeal.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HotDealRedisStockService {

    private final StringRedisTemplate stringRedisTemplate;

    private static final String HOTDEAL_STOCK_KEY_PREFIX = "hotdeal:stock:";

    // Redis에 보낼 Lua 스크립트 객체.
    private static final DefaultRedisScript<Long> DECREASE_STOCK_SCRIPT = createDecreaseStockScript();

    // Lua 스크립트 설정.
    private static DefaultRedisScript<Long> createDecreaseStockScript(){
        DefaultRedisScript<Long> script = new DefaultRedisScript<>(); //빈 스크립트 객체 생성
        script.setResultType(Long.class); // 스크립트 실행 결과값 반환 타입(Long)
        script.setScriptText("""
                 local stock = tonumber(redis.call('GET', KEYS[1]))
                 local quantity = tonumber(ARGV[1])
                 
                 if stock == nil then
                     return -1
                 end
 
                 if quantity == nil or quantity < 1 then
                     return -2
                 end
 
                 if stock < quantity then
                     return 0
                 end
 
                 redis.call('DECRBY', KEYS[1], quantity)
                 return 1
                 """);
        // KEYS[1] = hotdeal:stock:1같은 Redis key
        // ARGV[1] = 구매수량
        /* 1 = 차감 성공 / 0 = 재고부족 / -1 = Redis에 재고 key 없음 / -2 = 수량 이상함 */
        // nil -> 값의 부재 or 존재하지 않음.
        return script;
    }

    // 키 생성 메서드. key -> hotdeal:stock:{hotDealId} = hotdeal:stock:3
    private String createStockKey(Long hotDealId) {
        return HOTDEAL_STOCK_KEY_PREFIX + hotDealId;
    }

    // 초기 재고 세팅
    public void setStock(Long hotDealId, int stock){
        // 유효한 재고 세팅값인지 체크
        if(stock < 0){
            throw new IllegalStateException("Redis에 세팅할 핫딜 재고는 0 이상이어야 합니다.");
        }

        // key 만들기 + value 저장 (set)
        stringRedisTemplate.opsForValue().set(createStockKey(hotDealId), String.valueOf(stock));
    }

    // 현재 재고 가져오기
    public int getStock(Long hotDealId){
        // key만들어서 value조회 (get)
        String value = stringRedisTemplate.opsForValue().get(createStockKey(hotDealId));

        // null 체크
        if(value == null){
            throw new IllegalStateException("Redis에 핫딜 재고가 세팅되지 않았습니다.");
        }

        // int 변환 후 반환
        return Integer.parseInt(value);
    }

    // 재고 차감 성공/실패 -> 재고 충분한지 확인 후 차감해야함.
    public boolean decreaseStock(Long hotDealId, int quantity){
        Long result = stringRedisTemplate.execute(
                DECREASE_STOCK_SCRIPT, // 1. 실행할 스크립트 객체
                List.of(createStockKey(hotDealId)), // 2. KEYS[i]에 매핑될 리스트 (구매 요청하는 핫딜 id)
                String.valueOf(quantity) // 3. ARGV[i]에 매핑될 가변 인자 (구매 요청하는 수량 quantity -> 깍을 수량)
        );

        // 결과 조회
        if(result == null){
            throw new IllegalStateException("Redis 재고 차감 결과가 비어 있습니다.");
        }

        // 1 -> 성공
        if(result == 1L){ return true; }

        // 0 -> 실패(재고부족)
        if(result == 0L){ return false; }

        // -1 -> 실패(Redis에 재고 key 없음)
        if(result == -1L){
            throw new IllegalStateException("Redis에 핫딜 재고가 준비되어 있지 않습니다.");
        }

        // -2 -> 실패(수량 이상함)
        if(result == -2L){
            throw new IllegalStateException("구매 수량이 잘못되었습니다.");
        }

        throw new IllegalStateException("알 수 없는 Redis 재고 차감 결과입니다.");
    }

    // 실패 시 복구
    public void restoreStock(Long hotDealId, int quantity){
        // 복구하려는 핫딜 상품 존재 여부 체크
        if(hotDealId == null){
            throw new IllegalStateException("핫딜 ID가 누락되었습니다.");
        }

        // 유효한 수량인지 체크
        if(quantity < 1){
            throw new IllegalStateException("복구 수량이 잘못되었습니다.");
        }

        // Redis 재고 복구 요청 (increment)
        stringRedisTemplate.opsForValue().increment(createStockKey(hotDealId), quantity);
    }

    // 종료 후 Redis에 적재된 재고 삭제
    public void deleteStock(Long hotDealId){
        // key 만들기
        String key = createStockKey(hotDealId);

        // 데이터 삭제
        stringRedisTemplate.delete(key);
    }

}
