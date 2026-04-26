package demo.demo_spring.product.repository;

import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.domain.ProductStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    //findByName(), findByStatus(), findByCategory() 같은 커스텀 조회 -> 나중에 목록 필터링때 추가

    // 비관적 락 : DB에 자물쇠 + id로 상품 조회
    @Lock(LockModeType.PESSIMISTIC_WRITE) // DB에게 자물쇠 채우라 명령.
    @Query("select p from Product p where p.id=:productId") // 특정 id 조회
    Optional<Product> findByIdWithPessimisticLock(@Param("productId") Long productId);
    //메서드 인자로 들어온 Long id 값을 쿼리문의 :id 부분에 쏙 집어넣으라

    // 상품 정렬 조회 -> HIDDEN 상태 빼고
    List<Product> findByStatusNotOrderByCreatedAtDesc(ProductStatus status); //최신순 정렬
    List<Product> findByStatusNotOrderByPurchaseCountDescCreatedAtDesc(ProductStatus status); //구매순 정렬

}
