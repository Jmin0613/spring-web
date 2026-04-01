package demo.demo_spring.hotdeal.domain;

public enum HotDealStatus {
    READY, // 시작 전
    ON_SALE, // 판매 중
    END, // 정상 종료
    SOLD_OUT, // 재고 소진 종료
    STOPPED // 관리자 긴급 중단
}
