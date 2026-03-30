package demo.demo_spring.hotdeal.repository;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.domain.HotDealStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HotDealRepository extends JpaRepository<HotDeal, Long> {
    //비관적 락 + id로 핫딜 조회(@Query)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select h from HotDeal h where h.id = :id") //JPQL. @Lock 강조.
    Optional<HotDeal> findByIdWithPessimisticLock(@Param("id") Long id);

    //스케쥴러 핫딜 조회 조건 추가
    //@Query쓸만큼 복잡하지 않아서 spring data jpa
    List<HotDeal> findByStatusIn(List<HotDealStatus> statuses);
}