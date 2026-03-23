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
    // 컨트롤러,http,postman까지 갈 필요x -> 비관적 락 로직 제대로 동작하는지만 확인

    //테스트를 위한 핫딜 객체 생성 + 서비스, 레포지토리 연결
    private final HotDealService hotDealService;
    private final HotDealRepository hotDealRepository;

    @Autowired
    public HotDealServiceTest(HotDealService hotDealService,
                              HotDealRepository hotDealRepository) {
        this.hotDealService = hotDealService;
        this.hotDealRepository = hotDealRepository;
    }

    @Test //JUnit에게 테스트하라고 알려줌
    // 재고는 5개. 요청은 20개.
    public void concurrentTest() throws InterruptedException{
        // 만약 중간에 끊어지면 InterruptedException예외 던짐
        int threadCnt= 20; //스레드 개수
        AtomicInteger success = new AtomicInteger(); //성공횟수
        AtomicInteger fail = new AtomicInteger(); //실패횟수
        // 그냥 int로하면 여러 스레드가 동시에 값 올릴떄 꼬일수잇어서. 동시성테스트에서는 AtomicInteger사용.

        //테스트 상품 등록
        HotDeal hotDeal = new HotDeal();
        hotDeal.setTitle("테스트 상품");
        hotDeal.setPrice(10000);
        hotDeal.setDiscountPrice(5000);
        hotDeal.setQuantity(5); //재고
        hotDeal.setStartTime(LocalDateTime.now().minusMinutes(1)); // 1분전 시작 설정
        hotDeal.setEndTime(LocalDateTime.now().plusMinutes(10)); // 10분 후 종료 설정

        HotDeal savedHotDeal = hotDealRepository.save(hotDeal); //등록하여 핫딜 객체 가져오기
        //serivce를 이용하지 않고 repository를 이용해 save한 이유
        // 서비스에 저장하면 그쪽 다른 로직들과 엉킬수도있고
        //내가 테스트 하는 목적인 "비관적 락"의 동작만을 살펴볼 수 없기에
        //이를 위해 준비? 테스트 데이터를 가장 짧게 레포지토리에 넣기위해 사용.
        Long id = savedHotDeal.getId();

        // 20개의 스레드 관리할 풀 생성
        ExecutorService executorService = Executors.newFixedThreadPool(32);
        //ExecutorService : 스레드들에게 일을 시키는 관리자
        //이전에는 new Thread(...)였는데, 직접 계속 만들면 불편하니간 자바가 관리하도록 하는 것.
        // 내가 해야하는 작업을 제출하면, 이녀석이 스레드 풀에서 작업을 실행

        //Executors.newFixedThreadPool(32) : 고정된 개수의 작업스레드 32개를 가진 풀을 만들어라
        //요청은 20개지만 32로 풀을 만들었기에, 20개 작업 충분히 동시에 처리 가능

        // 20번 작업 끝날때까지 대기
        CountDownLatch latch = new CountDownLatch(threadCnt);
        //몇개 작업이 끝낫는지 세는 카운터.

        //ExecutorService = 일 시키는 관리자
        //newFixedThreadPool(32) = 직원 32명 고용
        //CountDownLatch(20) = 끝나야 할 작업 20개 체크리스트

        // 테스트 실행 : 20명이 동시에 구매요청 상황
        for(int i=0;i<threadCnt;i++){
            executorService.submit(()->{
                try{
                    hotDealService.buyPessimisticLock(id);
                    success.incrementAndGet(); //성공횟수 +1
                    // success++ 안한 이유 : 여러스레드가 동시에 ++하면 꼬일 수 있기에,
                    //증가 연산을 원자적으로 안전하게 해주는 AtomicInteger의 incrementAndGet()사용.
                } catch(Exception e) {
                    fail.incrementAndGet(); // 실패 횟수 +1
                }finally {
                    latch.countDown();
                    //각 작업이 끝날때마다 latch.countdown을 통해 재고 -1.
                }
            });
        }
        latch.await(); //20번 작업 모두 끝날떄까지 여기서 대기!(latch는 작업 몇개 남았는지 세는 도구)
        executorService.shutdown(); //새로운 작업을 안받는다는 종료 요청

        //검증 : 재고 0, 성공횟수 5, 실패횟수 15 여야함.
        HotDeal testResult = hotDealRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("핫딜 없음"));
        //JUnit의 검증 메서드. assertEquals(기대값, 실제값)
        assertEquals(0,testResult.getQuantity());
        assertEquals(5, success.get());
        assertEquals(15,fail.get());
        // 출력만하면 눈으로 보고 판단을 내려야하는데, 이건 assertEquals가 알아서 판단해줌.
        //같으면 통과, 다르면 실패, 즉 테스트의 핵심은 출력보다 assert임!

        //assert가 검증만 하고 출력은 안 하기 때문에, 확인용
        //asserEquals는 검증만하지 출력은 안함.
        System.out.println("성공 횟수 = " + success.get());
        System.out.println("실패 횟수 = " + fail.get());
        System.out.println("최종 재고 = " + testResult.getQuantity());
    }

}
/* throw vs throws

throw = 지금 여기서 예외 발생
throws = 이 메서드는 이런 예외를 밖으로 넘길 수 있음

throw는 예외가 발생하면 바로 띄워버리는데,

throws는 예외가 발생한 순간, 메서드 안에서 안 잡으면 throws에 적힌 타입의 예외를 바깥 호출자에게 넘김.
(예외가 발생한 순간 바깥 호출자에게 넘긴다)
즉, 예외가 발생했을 때 여기서 처리 안 하고 밖으로 전달하겠다라는 것.

 */
