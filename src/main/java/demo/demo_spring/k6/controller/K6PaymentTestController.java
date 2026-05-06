package demo.demo_spring.k6.controller;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.domain.HotDealStatus;
import demo.demo_spring.hotdeal.repository.HotDealRepository;
import demo.demo_spring.hotdeal.service.HotDealRedisStockService;
import demo.demo_spring.k6.service.K6PaymentTestDataService;
import demo.demo_spring.payment.dto.PaymentPrepareRequest;
import demo.demo_spring.payment.dto.PaymentPrepareResponse;
import demo.demo_spring.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Profile("k6")
@RestController
@RequestMapping("/test/payments/hotdeals")
@RequiredArgsConstructor
public class K6PaymentTestController {
    /*
        k6 부하 테스트 전용 API
        실제 운영 API인 /payment/prepare는 세션 로그인에서 memberId를 꺼내지만,
        부하 테스트에서는 로그인 API 병목을 제거하기 위해 memberId를 직접 받음.

        단, 실제 결제 준비 로직은 paymentService.prepatePayment()를 그대로 호출.
    */

    private final PaymentService paymentService;
    private final HotDealRepository hotDealRepository;
    private final HotDealRedisStockService hotDealRedisStockService;
    private final K6PaymentTestDataService k6PaymentTestDataService;

    @PostMapping("/prepare")
    public ResponseEntity<?> prepareForK6(@RequestParam Long memberId,
                                          @RequestBody PaymentPrepareRequest request){
        if(memberId == null){
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "테스트 회원 ID가 누락됨."
            ));
        }

        // stack trace 예외 폭발 방어를 위해 409 conflict 반환
        try{
            PaymentPrepareResponse response = paymentService.preparePayment(memberId, request);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", response
            ));
        }catch (IllegalStateException e){
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /*
        K6 부하 테스트 전용 Redis 핫딜 재고 세팅 API

        Redis 재고 적재의 순간은 핫딜상태가 READY에서 ON_SALE으로 바뀔떄,
        이미 seed를 넣을때 ON_SALE로 들어가버려서 Redis에 적재가 안되는 문제 발생
        -> 로그인/스케쥴러/상태전환 타이밍과 관계없이
        K6 테스트 시작 전에 Redis 재고를 명확하게 준비해야 함.
    */
    @PostMapping("/{hotDealId}/redis-stock")
    public Map<String, Object> setHotDealRedisStockForK6(@PathVariable Long hotDealId,
                                                         @RequestParam Integer stock){
        if(stock == null || stock < 0){
            throw new IllegalStateException("Redis에 세팅할 재고는 0개 이상이어야 함.");
        }

        HotDeal hotDeal = hotDealRepository.findById(hotDealId)
                .orElseThrow(() -> new IllegalStateException("해당 핫딜 없음."));

        if(hotDeal.getStatus() != HotDealStatus.ON_SALE){
            throw new IllegalStateException("ON_SALE 상태의 핫딜만 K6 테스트 재고를 세팅할 수 있음");
        }

        hotDealRedisStockService.setStock(hotDealId, stock);

        return Map.of(
                "hotDealId", hotDealId,
                "redisStock", stock,
                "message", "Redis 핫딜 재고 세팅 완료"
        );
    }

    // Redis 재고 조회
    @GetMapping("/{hotDealId}/redis-stock")
    public Map<String, Object> getHotDealStockForK6(@PathVariable Long hotDealId){
        int stock = hotDealRedisStockService.getStock(hotDealId);

        return Map.of(
                "hotDealId", hotDealId,
                "redisStock", stock
        );
    }

    /*
        k6 테스트로 생성된 잔여 DB 데이터만 삭제한다.
        Redis 재고는 건드리지 않는다.
     */
    @PostMapping("/clear-test-data")
    public Map<String, Object> clearPaymentPrepareTestData() {
        return k6PaymentTestDataService.clearPaymentPrepareTestData();
    }

    /*
        k6 테스트 데이터 확인용.
        Redis 재고는 /{hotDealId}/redis-stock으로 확인한다.
     */
    @GetMapping("/test-data")
    public Map<String, Object> getPaymentPrepareTestData() {
        return k6PaymentTestDataService.countPaymentPrepareTestData();
    }

}
