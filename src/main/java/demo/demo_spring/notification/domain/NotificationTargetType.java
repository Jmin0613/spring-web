package demo.demo_spring.notification.domain;

public enum NotificationTargetType {
    // 알림 클릭시 이동할 대상 리소스 종류. 어디로 갈지면 표현하면 됨.

    HOTDEAL,
    PRODUCT_INQUIRY,
    NONE // 클릭 시 이동할 상세 리소스가 없는 경우
    // 추후 ORDER 확장 고려중
}
