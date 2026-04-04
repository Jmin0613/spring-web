package demo.demo_spring.order.repository;

import demo.demo_spring.order.domain.Orders;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface OrderRepository extends JpaRepository<Orders, Long> {
    // 주문 저장 -> save -> jpa 기본제공
    // 주문 단건 조회 -> findById -> jpa 기본제공
    // 주문 목록 조회 -> findAll -> jpa 기본제공

    List<Orders> findOrderByMember_Id(Long memberId);
    Optional<Orders> findByIdAndMember_Id(Long orderId, Long memberId);
}
