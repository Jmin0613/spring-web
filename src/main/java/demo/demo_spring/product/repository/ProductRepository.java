package demo.demo_spring.product.repository;

import demo.demo_spring.product.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    // 저장, 전체조회, 단건 조회, 삭제 -> 기본 제공
    //findByName(), findByStatus(), findByCategory() 같은 커스텀 조회 -> 나중에 목록 필터링때 추가
}
