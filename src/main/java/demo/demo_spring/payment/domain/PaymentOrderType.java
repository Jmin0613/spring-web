package demo.demo_spring.payment.domain;

public enum PaymentOrderType {
    //프론트OrderSheetPage 모드랑 맞추는 용도

    PRODUCT_DIRECT, //상품 바로구매
    HOTDEAL_DIRECT, // 핫딜 바로구매
    CART //장바구니 구매
}
