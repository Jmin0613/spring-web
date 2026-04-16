package demo.demo_spring.order.domain;

public enum ClaimStatus {
    // 취소, 반품 상태
    CANCEL_APPROVED, // 취소 승인 -> 취소 요청 허가
    CANCEL_REJECTED, // 취소 거절 -> 이미 발송같은 경우
    RETURNED // 반품 처리

}
