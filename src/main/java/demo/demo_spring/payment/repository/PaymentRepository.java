package demo.demo_spring.payment.repository;

import demo.demo_spring.payment.domain.Payment;
import demo.demo_spring.payment.domain.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    // paymentId로 결제정보payment 찾기 -> 만료 스케쥴러에도 사용.
    // 프론트가 paymentId를 전달 -> PaymentRepo.findByPaymentId(..) -> db의 결제 준비READY 기록 조회
    Optional<Payment> findByPaymentId(String paymentId);

    // 주문order 기준 결제기록payment 조회
    // 주문 상세에서 결제 정보 확인, 또는 주문 취소 시 결제 기록 조회용
    Optional<Payment> findByOrderId(Long orderId);

    // 결제상태 별 조회
    List<Payment> findByStatus(PaymentStatus status);

}
