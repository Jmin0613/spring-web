package demo.demo_spring.order.domain;

public enum OrderStatus {
    PENDING_PAYMENT, // 결제 대기
    PAID, // 결제 완료 + 주문 확정
    CANCELED, // 주문 취소
    EXPIRED // 결제 시간 만료

}