package demo.demo_spring.product.repository;

import demo.demo_spring.product.domain.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    // 엔티티와 기본키 타입 연결

    // 저장, 전체조회, 단건 조회, 삭제 -> 기본 제공
    //findByName(), findByStatus(), findByCategory() 같은 커스텀 조회 -> 나중에 목록 필터링때 추가

    // 비관적 락 + id로 상품 조회
    @Lock(LockModeType.PESSIMISTIC_WRITE) // DB에게 자물쇠 채우라 명령.

    // 특정 id 조회
    @Query("select p from Product p where p.id=:id")
    //Product라는 클래스를 p라는 이름으로 가져와라.
    // 조건 : product객체가 가진 id 필드값이, 파라미터로 돌어온 id랑 같은 것만 골라내라.

    // 없을수도 있으니 Optional<Product>
    Optional<Product> findByIdWithPessimisticLock(@Param("id") Long id);
    //@Param("id") Long id -> @Query안에 있는 :id부분에, 파라미터로 넘긴 Long id를 넣어라.
}
