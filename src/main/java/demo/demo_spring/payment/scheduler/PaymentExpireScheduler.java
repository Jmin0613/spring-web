package demo.demo_spring.payment.scheduler;

import demo.demo_spring.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class PaymentExpireScheduler {
    // 결제 대기 만료 주문 정리

    private final PaymentService paymentService;

    // 1분마다 결제 대기 만료 주문들 찾아서 정리(재고 + 상태 복구)
    @Scheduled(fixedDelay = 60000)
    public void expirePendingPayment(){
        paymentService.expirePendingPayments();
    }
}
