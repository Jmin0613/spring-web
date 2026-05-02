package demo.demo_spring.order.domain;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.product.domain.Product;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem {
    /*
        기존 OrderItem 생성은 구매확정으로 바로 이어짐.
        그러나 PortOne을 연결하며 변경됨.

        OrderItem 생성 = 주문상품 정보 기록 (pending)
        reserveStock() = 결제 준비 시 재고 선점
        confirmPurchase() = 결제 성공 후 구매수 확정
        restoreReservedStock() = 결제 만료/실패 시 선점 재고 복구
        cancelPaidOrder() = 결제 완료 주문 취소 시, 재고 + 구매수 복구
     */

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // PK -> 주문상품 레코드 1개 자체의 고유id

    @ManyToOne(fetch = FetchType.LAZY) //OrderItem은 Order속 주문상품들 정보. 어떤 Order에 속하는지 Order와 연결.
    @JoinColumn(name="order_id", nullable = false)
    //DB테이블에서 order_id라는 컬럼을 통해 주문 테이블과 연결
    private Orders order; // 어떤 주문에 속하는지 Order객체 참조용 FK

    @Enumerated(EnumType.STRING)
    private OrderItemType orderItemType; //PRODUCT, HOTDEAL. 결제 취소시, 재고복구를 위해 필요.

    @ManyToOne(fetch = FetchType.LAZY) //어떤 상품을 샀는지 Product와 연결
    @JoinColumn(name="product_id", nullable = false)
    //DB테이블에서 product_id라는 컬럼을 통해 상품 테이블과 연결
    private Product product; // db -> product_id -> 원본 상품 참조용 FK

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hot_deal_id")
    private HotDeal hotDeal; //주문 타입이 HotDeal일떄만 값 존재. -> null 체크 x.

    private String productNameSnapshot; // 구매당시 상품명
    private String imageUrlSnapshot; //구매당시 이미지
    private int quantity; // 주문수량
    private int orderPrice; // 주문 당시 가격(일반구매 or 핫딜구매)

    private OrderItem(Product product, HotDeal hotDeal, OrderItemType orderItemType,
                      int quantity, int orderPrice){
        //Product null 체크
        if(product == null){
            throw new IllegalStateException("구매하려는 원본 상품 정보가 누락되었습니다.");
        }
        //주문 타입 체크
        if(orderItemType == null){
            throw new IllegalStateException("주문 상품 타입이 누락되었습니다.");
        }
        // 구매수량 1이상 확인
        if(quantity < 1){
            throw new IllegalStateException("구매 수량이 잘못되었습니다.");
        }
        // 구매 당시 가격 0보다 큰지
        if(orderPrice < 1){
            throw new IllegalStateException("구매 가격이 잘못되었습니다.");
        }

        // HotDeal 주문일 시, hotDeal 널 체크
        if(orderItemType == OrderItemType.HOTDEAL && hotDeal == null){
            throw new IllegalStateException("핫딜 주문에는 핫딜 정보가 필요합니다.");
        }
        // Product 주문인데, hotDeal 잘 비어있나 체크
        if(orderItemType == OrderItemType.PRODUCT && hotDeal != null){
            throw new IllegalStateException("일반 상품 주문에는 핫딜 정보가 들어갈 수 없습니다.");
        }

        this.product = product; this.hotDeal = hotDeal; this.orderItemType = orderItemType;

        this.productNameSnapshot = product.getName();
        this.imageUrlSnapshot = product.getImageUrl();
        this.quantity = quantity; this.orderPrice = orderPrice;

    }

    // (Product) 주문상품 생성
    public static OrderItem createProductOrderItem(Product product, int quantity){
        return new OrderItem(
                product, null, OrderItemType.PRODUCT,
                quantity, product.getPrice()
        );
    }

    // (HotDeal) 주문상품 생성
    public static OrderItem createHotDealOrderItem(HotDeal hotDeal, int quantity){
        if(hotDeal == null){ // 내부생성자에서 null 체크 못하니 여기서.
            throw new IllegalStateException("핫딜 정보가 누락되었습니다.");
        }
        return new OrderItem(
                hotDeal.getProduct(), hotDeal, OrderItemType.HOTDEAL,
                quantity, hotDeal.getHotDealPrice()
        );
    }

    // 주문상품 생성 메서드 -> 나중에 결제 흐름 완성하면 삭제하기.
    public static OrderItem createOrderItem(Product product, int quantity, int orderPrice){
        return new OrderItem(
                product, null, OrderItemType.PRODUCT,
                quantity, orderPrice
        );
    }

    // Order 연결 메서드
    void setOrder(Orders order){
        this.order = order;
        // Order가 OrderItem.setOrder호출해서 연결하기
        // OrderItem생성메서드로 order를 연결할 수 있지만, order는 orderItem이 추가된걸 모를 수 있기 떄문.
    }

    // 구매수량*구매가격
    public int getTotalPrice(){
        return this.orderPrice * this.quantity;
        // Order가 getTotalPrice를 for문으로 호출해서 order의 총 구매가 구하기
    }

    // 결제 준비 시 재고 선점
    public void reserveStock(){
        // Product 재고 선점
        if(this.orderItemType == OrderItemType.PRODUCT){
            product.buy(this.quantity);
            return;
        }

        // HotDeal 재고 선점
        if(this.orderItemType == OrderItemType.HOTDEAL){
            //hotDeal.buy(this.quantity);
            // HOTDEAL 재고선점/차감은 PaymentService에서 Redis로 처리.
            // 여기서 hotDeal.buy()를 호출하면 Redis + DB 이중 차감이 발생.
            return;
        }

        throw new IllegalStateException("알 수 없는 주문 상품 타입입니다.");
    }

    // 결제 만료/실패 시 선점 재고 복구
    public void restoreReservedStock(LocalDateTime now){
        // 일반상품 (재고복구 + 상태복구)
        if(this.orderItemType == OrderItemType.PRODUCT){
            product.restoreStock(this.quantity);
            return;
        }

        // 핫딜 (재고복구 + 상태갱신)
        if(this.orderItemType == OrderItemType.HOTDEAL){
            //hotDeal.restoreReservedStock(this.quantity, now);
            // HOTDEAL 재고/상태 복구는 PaymentService에서 Redis로 처리.
            return;
        }

        throw new IllegalStateException("알 수 없는 주문 상품 타입입니다.");
    }

    // 결제 성공 시 구매수 증가 확정
    public void confirmPurchase(){
        product.increasePurchaseCount(this.quantity);
    }

    // 결제 완료 주문 취소 시, 재고 + 구매수 복구
    public void cancelPaidOrder(LocalDateTime now){
        restoreReservedStock(now);
        product.decreasePurchaseCount(this.quantity); //핫딜 판매도 원본 판매로 집계
    }
}