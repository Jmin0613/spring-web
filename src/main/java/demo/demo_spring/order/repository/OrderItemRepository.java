package demo.demo_spring.order.repository;

import demo.demo_spring.order.domain.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    // 주문상품 저장 -> save -> jpa 기본제공
    // 주문상품 조회 -> findById -> jpa 기본제공
}
