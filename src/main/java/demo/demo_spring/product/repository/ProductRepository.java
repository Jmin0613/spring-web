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
    // 비관적 락 : DB에 자물쇠 + id로 상품 조회
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id=:productId")
    Optional<Product> findByIdWithPessimisticLock(@Param("productId") Long productId);

    // (사용자) 상품 정렬 조회 -> HIDDEN 상태 빼고
    List<Product> findByStatusNotOrderByCreatedAtDesc(ProductStatus status); //최신순 정렬
    List<Product> findByStatusNotOrderByPurchaseCountDescCreatedAtDesc(ProductStatus status); //구매순 정렬

    // (관리자) 상품목록 최신순 조회
    List<Product> findAllByOrderByCreatedAtDesc();

}
