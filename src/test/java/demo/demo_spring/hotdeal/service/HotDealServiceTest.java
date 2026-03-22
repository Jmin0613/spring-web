package demo.demo_spring.hotdeal.service;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.repository.HotDealRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
public class HotDealServiceTest{
    // 동시성 제어 테스트 코드

    //테스트를 위한 핫딜 객체 생성 + 서비스, 레포지토리 연결
    private final HotDealService hotDealService;
    private final HotDealRepository hotDealRepository;

    @Autowired
    public HotDealServiceTest(HotDealService hotDealService,
                              HotDealRepository hotDealRepository) {
        this.hotDealService = hotDealService;
        this.hotDealRepository = hotDealRepository;
    }

    @Test // 재고는 5개. 요청은 20개.
    public void concurrentTest() throws InterruptedException{
        int threadCnt= 20; //스레드 개수
        AtomicInteger success = new AtomicInteger(); //성공횟수
        AtomicInteger fail = new AtomicInteger(); //실패횟수
        // 그냥 int로하면 여러 스레드가 동시에 값 올릴떄 꼬일수잇어서. 동시성테스트에서는 AtomicInteger사용.

        //핫딜 상품 등록
        HotDeal hotDeal = new HotDeal();
        hotDeal.setTitle("테스트 상품");
        hotDeal.setPrice(10000);
        hotDeal.setDiscountPrice(5000);
        hotDeal.setQuantity(5); //재고
        hotDeal.setStartTime(LocalDateTime.now().minusMinutes(1)); // 1분전 시작 설정
        hotDeal.setEndTime(LocalDateTime.now().plusMinutes(10)); // 10분 후 종료 설정

        HotDeal savedHotDeal = hotDealRepository.save(hotDeal); //등록하여 핫딜 객체 가져오기
        Long id = savedHotDeal.getId();

        // 20개의 스레드 관리할 풀 생성
        ExecutorService executorService = Executors.newFixedThreadPool(32);
        // 20번 작업 끝날때까지 대기
        CountDownLatch latch = new CountDownLatch(threadCnt);

        // 테스트 실행 : 20명이 동시에 구매요청 상황
        for(int i=0;i<threadCnt;i++){
            executorService.submit(()->{
                try{
                    hotDealService.buyPessimisticLock(id);
                    success.incrementAndGet(); //성공횟수 +1
                } catch(Exception e) {
                    fail.incrementAndGet(); // 실패 횟수 +1
                }finally {
                    latch.countDown(); //작업 하나 끝날때마다 재고 -1
                }
            });
        }
        latch.await(); //20번 작업 모두 끝날떄까지 여기서 대기!(latch는 작업 몇개 남았는지 세는 도구)
        executorService.shutdown();

        //검증 : 재고 0, 성공횟수 5, 실패횟수 15 여야함.
        HotDeal testResult = hotDealRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("핫딜 없음"));
        assertEquals(0,testResult.getQuantity());
        assertEquals(5, success.get());
        assertEquals(15,fail.get());

        //assert가 검증만 하고 출력은 안 하기 때문에, 따로 출력해서 확인
        //asserEquals는 검증만하지 출력은 안함.
        System.out.println("성공 횟수 = " + success.get());
        System.out.println("실패 횟수 = " + fail.get());
        System.out.println("최종 재고 = " + testResult.getQuantity());
    }

}
