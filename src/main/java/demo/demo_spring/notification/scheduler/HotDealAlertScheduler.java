package demo.demo_spring.notification.scheduler;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.domain.HotDealStatus;
import demo.demo_spring.hotdeal.repository.HotDealRepository;
import demo.demo_spring.notification.producer.HotDealAlertMessageProducer;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Transactional
public class HotDealAlertScheduler {
    // 핫딜 사전 알림 생성

    // 알림 조건 -> READY상태(status) + 10분 뒤 시작(startTime)하는 HotDeal
    // HotDeal 기준으로 조회 진행

    private final HotDealRepository hotDealRepository;
    private final HotDealAlertMessageProducer hotDealAlertMessageProducer;

    public HotDealAlertScheduler(HotDealRepository hotDealRepository,
                                 HotDealAlertMessageProducer hotDealAlertMessageProducer){
        this.hotDealRepository = hotDealRepository;
        this.hotDealAlertMessageProducer = hotDealAlertMessageProducer;
    }

    @Scheduled(fixedRate = 60000) // 60초마다 실행
    public void preStartAlertHotDeal(){
        // 현재시간
        // System.out.println("사전 알림 스케쥴러 실행");
        LocalDateTime now = LocalDateTime.now();

        // 현재시간 + 9min~10min
        LocalDateTime from = now.plusMinutes(9);
        LocalDateTime to = now.plusMinutes(10);

        // 시작 10분전이 된 HotDeal 찾기
        List<HotDeal> hotDeals = hotDealRepository.findAllByStatusAndStartTimeBetween(HotDealStatus.READY, from, to);

        // 해당 HotDealId를 Producer에 넘기기
        for (HotDeal hotDeal : hotDeals){
            hotDealAlertMessageProducer.publishPreStartAlert(hotDeal.getId());
        }

    }
}
