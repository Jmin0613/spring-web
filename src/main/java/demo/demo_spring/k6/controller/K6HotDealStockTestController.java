package demo.demo_spring.k6.controller;

import demo.demo_spring.k6.service.K6HotDealStockTestService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Profile("k6")
@RestController
@RequestMapping("/test/stocks/hotdeals")
@RequiredArgsConstructor
public class K6HotDealStockTestController {
    /*
        k6 부하 테스트 전용 API
        실제 운영 API인 /payment/prepare는 세션 로그인에서 memberId를 꺼내지만,
        부하 테스트에서는 로그인 API 병목을 제거하기 위해 memberId를 직접 받음.

        단, 실제 결제 준비 로직은 paymentService.prepatePayment()를 그대로 호출.
    */

    private final K6HotDealStockTestService k6HotDealStockTestService;

    /*
        성능 차이 비교를 위한 일반 db 접근, Pessimistic Lock API
        비교를 위해 hotDeal 구매로 진행.
    */

    // 일반 db 접근, no-lock
    @PostMapping("/{hotDealId}/no-lock")
    public Map<String, Object> hotDealNoLockForK6(@PathVariable Long hotDealId,
                                                  @RequestParam(defaultValue = "1") Integer quantity,
                                                  @RequestParam(defaultValue = "0") Long delayMs) {
        boolean success = k6HotDealStockTestService.reserveNoLock(hotDealId, quantity, delayMs);

        return Map.of(
                "strategy", "NO_LOCK",
                "hotDealId", hotDealId,
                "quantity", quantity,
                "success", success
        );
    }

    // pessimistic lock
    @PostMapping("/{hotDealId}/pessimistic-lock")
    public Map<String, Object> hotDealPessimisticForK6(@PathVariable Long hotDealId,
                                                       @RequestParam(defaultValue = "1") Integer quantity){
        boolean success = k6HotDealStockTestService.reserveWithPessimisticLock(hotDealId, quantity);

        return Map.of(
                "strategy", "PESSIMISTIC_LOCK",
                "hotDealId", hotDealId,
                "quantity", quantity,
                "success", success
        );
    }

    // redis + lua
    @PostMapping("/{hotDealId}/redis-lua")
    public Map<String, Object> hotDealRedisStockForK6(@PathVariable Long hotDealId,
                                                      @RequestParam(defaultValue = "1") Integer quantity){
        boolean success = k6HotDealStockTestService.reserveWithRedisLua(hotDealId, quantity);

        return Map.of(
                "strategy", "REDIS_LUA",
                "hotDealId", hotDealId,
                "quantity", quantity,
                "success", success
        );
    }

    /*
        K6 부하 테스트 전용 Redis 핫딜 재고 세팅 API

        Redis 재고 적재의 순간은 핫딜상태가 READY에서 ON_SALE으로 바뀔떄,
        이미 seed를 넣을때 ON_SALE로 들어가버려서 Redis에 적재가 안되는 문제 발생
        -> 로그인/스케쥴러/상태전환 타이밍과 관계없이
        K6 테스트 시작 전에 Redis 재고를 명확하게 준비해야 함.
    */

    // 테스트 전, db 및 redis 재고 초기화 및 적재
    @PostMapping("/{hotDealId}/reset")
    public Map<String, Object> resetStock(@PathVariable Long hotDealId, @RequestParam Integer stock){
        if(stock == null){
            throw new IllegalStateException("초기화할 재고가 누락되었습니다.");
        }

        k6HotDealStockTestService.resetDbAndRedisStock(hotDealId, stock);

        return Map.of(
                "hotDealId", hotDealId,
                "dbStock", k6HotDealStockTestService.getDbStock(hotDealId),
                "redisStock", k6HotDealStockTestService.getRedisStock(hotDealId),
                "message", "테스트 재고 초기화 완료"
        );
    }

    // 테스트 후, db 및 Redis 재고 조회
    @GetMapping("/{hotDealId}")
    public Map<String, Object> getHotDealStockForK6(@PathVariable Long hotDealId){
        return Map.of(
                "hotDealId", hotDealId,
                "dbStock", k6HotDealStockTestService.getDbStock(hotDealId),
                "redisStock", k6HotDealStockTestService.getRedisStock(hotDealId)
        );
    }
}