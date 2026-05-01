package demo.demo_spring.payment.domain;

import demo.demo_spring.order.domain.Orders;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment {
    // Payment -> 결제 거래 기록

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 무조건 결제는 주문 1건에 대응 -> @OneToOne말고 @ManyToOne + unique제약
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="order_id", nullable = false, unique = true)
    private Orders order;

    @Column(nullable = false, unique = true)
    private String paymentId; // PortOne에 넘길 결제 고유 id. 절대 null X.

    @Column(nullable = false) // int라 null어차피 안들어가겠지만, 의도를 조금 더 보여주기.
    private int amount; // 결제 요청 금액

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status; //결제 상태

    private LocalDateTime requestedAt; // 결제 요청 시간
    private LocalDateTime paidAt; // 결제 완료 시간
    private LocalDateTime canceledAt; // 결제 취소 시간
    private LocalDateTime expiredAt; //결제 만료 시간

    private String cancelReason; //취소 사유

    private Payment(Orders order, String paymentId, int amount, LocalDateTime now){
        // 필수값 null 체크
        if(order == null){
            throw new IllegalStateException("결제할 주문 정보가 누락되었습니다.");
        }
        if(paymentId == null || paymentId.isBlank()){
            throw new IllegalStateException("결제 ID가 누락되었습니다.");
        }
        if(amount < 1){
            throw new IllegalStateException("결제 금액이 잘못되었습니다.");
        }
        if(now == null){
            throw new IllegalStateException("현재 시간이 누락되었습니다.");
        }

        this.order = order;
        this.paymentId = paymentId;
        this.amount = amount;
        this.status = PaymentStatus.READY; //결제 대기(결제창 호출 전, 준비 완료)
        this.requestedAt = now; //결제 요청 시간

    }

    // 결제 거래기록READY 생성
    public static Payment createReadyPayment(Orders order, String paymentId, int amount, LocalDateTime now){
        return new Payment(order, paymentId, amount, now);
    }

    // 결제완료PAID 처리
    public void markAsPaid(LocalDateTime now){
        if(now == null){
            throw new IllegalStateException("현재 시간이 누락되었습니다.");
        }
        if(this.status != PaymentStatus.READY){
            throw new IllegalStateException("결제 준비 상태의 결제만 완료 처리할 수 있습니다.");
        }

        this.status = PaymentStatus.PAID;
        this.paidAt = now; //결제완료 시간
    }

    // 결제 실패FAIL
    public void fail(){
        if(this.status!= PaymentStatus.READY){
            throw new IllegalStateException("결제 준비 상태의 결제만 실패 처리할 수 있습니다.");
        }
        this.status = PaymentStatus.FAILED;
    }

    // 결제 시간 만료EXPIRE
    public void expire(LocalDateTime now) {
        if(now == null){
            throw new IllegalStateException("현재 시간이 누락되었습니다.");
        }
        if(this.status != PaymentStatus.READY){
            throw new IllegalStateException("결제 준비 상태의 결제만 만료 처리할 수 있습니다.");
        }
        this.status = PaymentStatus.EXPIRED;
        this.expiredAt = now;
    }

    // 결제 취소
    public void cancel(String reason, LocalDateTime now) {
        if(now == null){
            throw new IllegalStateException("현재 시간이 누락되었습니다.");
        }
        if(this.status != PaymentStatus.PAID){
            throw new IllegalStateException("결제 완료 상태의 결제만 취소할 수 있습니다.");
        }
        this.status = PaymentStatus.CANCELED;
        this.canceledAt = now;
        this.cancelReason = reason;
    }

    // 실제 결제 금액과 결제 요청 금액 비교
    public boolean isAmountMatched(int paidAmount) {
        //paidAmount -> PortOne에서 실제 결제된 금액
        //amount -> 서버가 결제 요청한 금액
        return this.amount == paidAmount;
    }
}
