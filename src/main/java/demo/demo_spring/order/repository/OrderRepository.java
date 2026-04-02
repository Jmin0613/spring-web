package demo.demo_spring.order.repository;

import jakarta.persistence.criteria.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
}
