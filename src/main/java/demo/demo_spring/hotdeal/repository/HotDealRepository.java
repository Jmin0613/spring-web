package demo.demo_spring.hotdeal.repository;

import demo.demo_spring.hotdeal.domain.HotDeal;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

// @Repository -> JpaRepository쓰면 자동으로 처리되서 안붙여도 되긴함.
public interface HotDealRepository extends JpaRepository<HotDeal, Long> {
    //사용 테이블 -> HotDeal / 기본키 타입 -> Long

    //비관적 락 + id로 상품 조회
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    // 비관적 pessimistic
    //db에게 "이 데이터 읽을떄 자물쇠 채워줘!내가 수정할떄까지 아무도 못 건드리게!"라고 명령
    // 실제 db로 날아가는 쿼리확인해보면 FOR UPDATE가 뜬다함. 이게 DB 레벨의 물리적 자물쇠.
    @Query("select h from HotDeal h where h.id = :id") //JPQL 자바의 엔티티 객체
    //HotDeal이라는 자바 클래스를 h라는 별명으로 가져와라
    // 그런데 조건이 있다. HotDeal객체가 가진 id필드값이 파라미터로 들어온 id랑 같은 것만 골라내라. (=:id)
    Optional<HotDeal> findByIdWithPessimisticLock(@Param("id") Long id);



}
    /* 공부하다 궁금해진 것. jpa에 이미 findById있는데 왜 @Query를 쓰는걸가?
    비관적 락(@Lock)을 걸기위해 이 query가 실행되는 시점을, 직접 통제하고 싶어서.
    나중에 핫딜 정보와 상품정보를 한꺼번에 가져오는 Fetch join같은 복잡한 쿼리가 필요할떄,
    이 @Query안에 우리가 원하는 로직을 정교하게 적을 수 잇음. 그래서 따로 만들어주는 거임.
    즉, 꼭 필요한건 아니지만, 지금처럼 락 조회 메서드를 따로 만들때는 좋다.
     */

    /* jpa에서 비관적 락 구현하는 LockModType의 종류 3가지
    PESSIMISTIC_READ : 다른 트랜잭션에서 데이터 읽기(조회)만 가능. 쓰기X
    PESSIMISTIC_WRITE(FOR UPDATE의 주인공) : 다른 트랜잭션에게 내 트랜잭션 끝나기 전까지 대기시킴(읽기,쓰기 X)
    PESSIMISTIC_FORCE_INCREMENT : 다른 트랜잭션에서 읽기,쓰기 X + 건드리기만해도 버전 올리는 버저닝
    */