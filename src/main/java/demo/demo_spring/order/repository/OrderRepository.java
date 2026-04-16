package demo.demo_spring.order.repository;

import demo.demo_spring.order.domain.Orders;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface OrderRepository extends JpaRepository<Orders, Long> {
    // 주문 저장 -> save -> jpa 기본제공
    // 주문 단건 조회 -> findById -> jpa 기본제공
    // 주문 목록 조회 -> findAll -> jpa 기본제공

    // 특정회원의 주문을 최근순으로 모두 가져오기
    List<Orders> findAllByMemberIdOrderByOrderDateDesc(Long memberId);
    // 특정회원의 특정주문을 가져오기
    Optional<Orders> findByIdAndMemberId(Long orderId, Long memberId);

    List<Orders> findAllByOrderByOrderDateDesc();


}
