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
    // 비관적 락 : DB에 자물쇠 + id로 상품 조회

    //1번
    @Lock(LockModeType.PESSIMISTIC_WRITE)

    //2번
    @Query("select h from HotDeal h where h.id = :id") //JPQL @Lock 강조하기 위해 @Query사용
    // select h -> 객체 전체(h)를 통째로 조회한다
    // from HotDeal h -> 조회할 대상은 HotDeal이라는 엔티티 클래스다
    // where p.id=:id -> 그중에서 id 필드값이 내가 파라미터로 넘긴 :id와 같은 것만 골라내라

    //3번
    Optional<HotDeal> findByIdWithPessimisticLock(@Param("id") Long id);
    //메서드 인자로 들어온 Long id 값을 쿼리문의 :id 부분에 쏙 집어넣으라
    // 없을수도 있으니 Optional<Product>

    // HotDealStatusScheduler 핫딜 조회 조건 추가
    //@Query쓸만큼 복잡하지 않아서 spring data jpa
    List<HotDeal> findByStatusIn(List<HotDealStatus> statuses);

    // HotDealAlertScheduler 조회
    List<HotDeal> findAllByStatusAndStartTimeBetween(HotDealStatus status,
                                                     LocalDateTime from,
                                                     LocalDateTime to);
}