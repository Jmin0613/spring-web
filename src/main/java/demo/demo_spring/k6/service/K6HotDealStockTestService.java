package demo.demo_spring.k6.service;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.repository.HotDealRepository;
import demo.demo_spring.hotdeal.service.HotDealRedisStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Profile("k6")
@Service
@RequiredArgsConstructor
public class K6HotDealStockTestService {

    private final HotDealRepository hotDealRepository;
    private final HotDealRedisStockService hotDealRedisStockService;

    /*
        테스트 시작 전, db재고와 redis재고를 같은 값으로 맞추기.
        no-lock, pessimistic-lock, redis-lua를 같은 초기 조건에서 비교하기 위함.
     */
    @Transactional
    public void resetDbAndRedisStock(Long hotDealId, int stock){
        if(stock < 0){
            throw new IllegalStateException("테스트 재고는 1개 이상이어야 함.");
        }

        HotDeal hotDeal = hotDealRepository.findById(hotDealId)
                .orElseThrow(() -> new IllegalStateException("해당 핫딜 없음."));

        hotDeal.syncHotDealStock(stock);
        hotDealRedisStockService.setStock(hotDealId, stock);
    }

    /*
        1. 일반 db 접근 방식
        예상 : 동시 요청에서 여러 트랜잭션이 같은 재고 값을 읽을 수 있어서,
        lost update 또는 성공 수/최종 재고 불일치 발생 가능성 예상됨.
     */
    @Transactional
    public boolean reserveNoLock(Long hotDealId, int quantity, long delayMs){
        validateQuantity(quantity);

        HotDeal hotDeal = hotDealRepository.findById(hotDealId)
                .orElseThrow(() -> new IllegalStateException("해당 핫딜 없음"));

        int currentStock = hotDeal.getHotDealStock();

        if (currentStock < quantity) {
            return false;
        }

        /*
            no-lock에서 동시성 문제 확인하기 위한
            의도적인 테스트용 지연.
            조회와 수정 사이 간격 일부러 벌림.
         */
        sleepForTest(delayMs);

        hotDeal.syncHotDealStock(currentStock - quantity);
        return true;
    }


    /*
        2. pessimistic lock
        HotDeal row에 PESSIMISTIC_WRITE로 lock 걸어서 재고 확인/차감.
        예상 : 정합성은 보장되겠지만 동싱에 몰리면 db row lco 대기가 생길 것 같음.
        이 lock 병목이 길게가면 스레드 풀 고갈까지 예상됨.
     */
    @Transactional
    public boolean reserveWithPessimisticLock(Long hotDealId, int quantity){
        validateQuantity(quantity);

        HotDeal hotDeal = hotDealRepository.findByIdWithPessimisticLock(hotDealId)
                .orElseThrow(() -> new IllegalStateException("해당 핫딜 없음."));

        int currentStock = hotDeal.getHotDealStock();

        if(currentStock < quantity){
            return false;
        }

        hotDeal.syncHotDealStock(currentStock - quantity);
        return true;
    }

    /*
        3. redis + lua
        redis안에서 조회/검증/차감을 원자적으로 처리.
        db row lock없이 재고 선점 가능.
     */
    public boolean reserveWithRedisLua(Long hotDealId, int quantity){
        validateQuantity(quantity);
        return hotDealRedisStockService.decreaseStock(hotDealId, quantity);
    }


    /* 헬퍼 메서드 */
    @Transactional(readOnly = true)

    // 테스트 후, db 실제로 저장된 재고 개수 조회
    public int getDbStock(Long hotDealId){
        HotDeal hotDeal = hotDealRepository.findById(hotDealId)
                .orElseThrow(() -> new IllegalStateException("해당 핫딜 없음.."));

        return hotDeal.getHotDealStock();
    }

    // 테스트 후, redis 실제로 저장된 재고 개수 조회
    public int getRedisStock(Long hotDealId){
        return hotDealRedisStockService.getStock(hotDealId);
    }

    // 구매 요청 수량 유효성 체크
    private void validateQuantity(int quantity){
        if(quantity < 1){
            throw new IllegalStateException("차감 수량은 1개 이상이어야 함.");
        }
    }

    // no-lock 지연용 메서드
    private void sleepForTest(long delayMs){
        if(delayMs <= 0){
            return;
        }

        try{
            Thread.sleep(delayMs);
        } catch (InterruptedException e){
            Thread.currentThread().interrupt();
            throw new IllegalStateException("테스트 지연 중 인터럽트 발생.");
        }
    }

}
