package demo.demo_spring.hotdeal.repository;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.domain.HotDealStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface HotDealRepository extends JpaRepository<HotDeal, Long> {

    // HotDealStatusScheduler 핫딜 조회 조건 추가
    List<HotDeal> findByStatusIn(List<HotDealStatus> statuses);

    // HotDealAlertScheduler 조회
    List<HotDeal> findAllByStatusAndStartTimeBetween(HotDealStatus status,
                                                     LocalDateTime from,
                                                     LocalDateTime to);
}