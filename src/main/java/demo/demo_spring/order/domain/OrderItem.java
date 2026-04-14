package demo.demo_spring.order.domain;

import demo.demo_spring.product.domain.Product;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // PK -> 주문상품 레코드 1개 자체의 고유id

    @ManyToOne(fetch = FetchType.LAZY) //OrderItem은 Order속 주문상품들 정보. 어떤 Order에 속하는지 Order와 연결.
    @JoinColumn(name="order_id", nullable = false)
    //DB테이블에서 order_id라는 컬럼을 통해 주문 테이블과 연결
    private Orders order; // 어떤 주문에 속하는지 Order객체 참조용 FK

    @ManyToOne(fetch = FetchType.LAZY) //어떤 상품을 샀는지 Product와 연결
    @JoinColumn(name="product_id", nullable = false)
    //DB테이블에서 product_id라는 컬럼을 통해 상품 테이블과 연결
    private Product product; // db -> product_id -> 원본 상품 참조용 FK

    private String productNameSnapshot; // 구매당시 상품명
    private int quantity; // 주문수량
    private int orderPrice; // 주문 당시 가격(일반구매 or 핫딜구매)

    private OrderItem(Product product, int quantity, int orderPrice){
        //Product null 체크
        if(product == null){
            throw new IllegalStateException("구매하려는 원본 상품 정보가 누락되었습니다.");
        }
        // 구매수량 1이상 확인
        if(quantity <= 0){
            throw new IllegalStateException("구매 수량이 잘못되었습니다.");
        }
        // 구매 당시 가격 0보다 큰지
        if(orderPrice<=0){
            throw new IllegalStateException("구매 가격이 잘못되었습니다.");
        }

        this.product = product; this.productNameSnapshot = product.getName();
        this.quantity = quantity; this.orderPrice = orderPrice;
    }

    // 주문상품 생성 메서드
    public static OrderItem createOrderItem(Product product, int quantity, int orderPrice){
        return new OrderItem(product, quantity, orderPrice);
    }

    // Order 연결 메서드
    void setOrders(Orders order){
        this.order = order;
        // Order가 OrderItem.setOrder호출해서 연결하기
        // OrderItem생성메서드로 order를 연결할 수 있지만, order는 orderItem이 추가된걸 모를 수 있기 떄문.
    }

    // 구매수량*구매가격
    public int getTotalPrice(){
        return this.orderPrice * this.quantity;
        // Order가 getTotalPrice를 for문으로 호출해서 order의 총 구매가 구하기
    }

    // 주문 취소 메서드
    public void orderCancel(){
        product.restoreStock(this.quantity);
    }
}