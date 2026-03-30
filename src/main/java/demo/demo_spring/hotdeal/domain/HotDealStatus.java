package demo.demo_spring.hotdeal.domain;

public enum HotDealStatus {
    READY, // 시작전, 대기중
    ON_SALE, // 진행 중
    END, // 종료
    SOLD_OUT //재고소진
}
