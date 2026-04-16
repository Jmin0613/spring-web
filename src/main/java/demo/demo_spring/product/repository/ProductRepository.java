package demo.demo_spring.product.repository;

import demo.demo_spring.product.domain.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    //findByName(), findByStatus(), findByCategory() 같은 커스텀 조회 -> 나중에 목록 필터링때 추가

    // 비관적 락 : DB에 자물쇠 + id로 상품 조회

    //1번
    @Lock(LockModeType.PESSIMISTIC_WRITE) // DB에게 자물쇠 채우라 명령.

    //2번
    @Query("select p from Product p where p.id=:productId") // 특정 id 조회
    // select p -> 객체 전체(p)를 통째로 조회한다
    // from Product p -> 조회할 대상은 Product라는 엔티티 클래스다
    // where p.id=:id -> 그중에서 id 필드값이 내가 파라미터로 넘긴 :id와 같은 것만 골라내라

    //3번
    Optional<Product> findByIdWithPessimisticLock(@Param("productId") Long productId);
    //메서드 인자로 들어온 Long id 값을 쿼리문의 :id 부분에 쏙 집어넣으라
    // 없을수도 있으니 Optional<Product>
}
