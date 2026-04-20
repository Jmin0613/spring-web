package demo.demo_spring.hotdeal.scheduler;

import demo.demo_spring.hotdeal.domain.HotDealStatus;
import demo.demo_spring.hotdeal.repository.HotDealRepository;

import demo.demo_spring.hotdeal.service.HotDealService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Transactional
public class HotDealStatusScheduler {
    // 핫딜 상태 변경 스케쥴러

    private final HotDealRepository hotDealRepository;
    private final HotDealService hotDealService;

    public HotDealStatusScheduler(HotDealRepository hotDealRepository, HotDealService hotDealService) {
        this.hotDealRepository = hotDealRepository;
        this.hotDealService = hotDealService;
    }

    @Scheduled(fixedRate = 60000) //60초마다 실행.
    public void refreshHotDealStatus() {
        // 현재시간 만들기
        LocalDateTime now = LocalDateTime.now();

        // 상태 변경 가능성이 있는 READY, ON_SALE만 조회
        List<HotDealStatus> targetStatuses = List.of(HotDealStatus.READY, HotDealStatus.ON_SALE);
        hotDealRepository.findByStatusIn(targetStatuses)
                .forEach(hotDeal -> hotDealService.refreshHotDealStatus(hotDeal, now)); //상태 자동 갱신 메서드 호출

    }
}
