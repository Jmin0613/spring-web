package demo.demo_spring.notification.domain;

public enum NotificationType {
    // 알림이 생성된 이유/이벤트 종류 -> 세부 이벤트를 구체적으로 표현.
    // 단순 도메인이 아니라, 실제로 알림을 발생시킨 이벤트를 표현

    PRODUCT_INQUIRY_ANSWERED, // 문의 답변 알림
    HOTDEAL_RRESTART_ALERT // 핫딜 시작 알림
    // 추후 추가 예정
}
