package demo.demo_spring.payment.domain;

public enum PaymentStatus {
    READY, // 결제창 호출 전, 결제 "준비를" 완료
    PAID, // Port One 결제 검증 성공
    FAILED, // 결제 실패
    CANCELED, // 결제 후 취소
    EXPIRED // 결제 시간 만료
}
/*
OrderStatus는 쇼핑몰 도메인의 주문 생명주기를 나타내고,
PaymentStatus는 PortOne 결제 거래의 생명주기를 나타냄.

두 상태는 성공/취소/만료 시 함께 변경되지만,
관심사가 다르기 때문에 Orders와 Payment로 분리함.
*/