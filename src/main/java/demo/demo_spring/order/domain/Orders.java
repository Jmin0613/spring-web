package demo.demo_spring.order.domain;

import demo.demo_spring.member.domain.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.*;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Orders {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; //PK. 주문번호(관계자용)
    // private Long orderNum; // 주문번호(주문자/회원용) -> 시간 이용해서 만들기. ---> 나중에 별도규칙 만들어 추가하기.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    // DB테이블에서 member_id라는 컬럼을 통해 회원(주문자) 테이블과 연결
    private Member member; //db -> member_id

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    // cascade = CascadeType.ALL : 부모에게 일어난 일을 자식에게도 똑같이 전파
    // 이거 안하면 나중에 save할때, order만 save하면 orderItem들은 저장되지 않아서 각각 save해줘야해서 귀찮음.
    // 이거 해두면 부모인 order만 save해도 그 안에 담긴 자식들 orderItem들도 자동으로 함께 save되서 편함.
    // 물론 order 삭제하면 orderItem들도 삭제됨.
    // orphanRemoval = true : 부모와의 연결이 끊어진 자식은 자동으로 삭제
    // 이거 없으면 List에서는 빠져도 db에는 해당 orderitem이 그대로 남아있는데,
    // 이거하면 List에서 제거되는 순간 연결이 끊어졋다고 JPA가 판단해서 DB에서도 삭제해버림.
    // 이 둘을 세트로 많이 쓰는 이유
    // 1. 주문 상품은 반드시 특정 주문에 소속되어야 해서 (독립적으로 존재 X)
    // 2. 주문이 사라지면 상품 내역도 사라져야 해서
    // 3. 주문에서 특정 상품을 빼면 그 데이터는 의미가 없어지니 삭제되야해서
    private List<OrderItem> orderItems = new ArrayList<>(); //주문상품 목록

    private int totalPrice;

    @CreatedDate
    private LocalDateTime orderDate;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    // 내부 생성자
    private Orders(Member member){
        //Member null 체크
        if (member == null){
            throw new IllegalStateException("구매자 정보가 누락되었습니다.");
        }
        //orderDate -> Auditing으로 저장
        this.member = member;
        this.status = OrderStatus.ORDERED;
    }

    // 주문서 생성 메서드
    public static Orders createOrder(Member member, List<OrderItem> orderItems){
        if(orderItems == null || orderItems.isEmpty()){
            // 목록 자체가 없음 -> null
            // 목록은 있는데, 상품이 없음(리스트는 전달됐지만, 주문상품이 0개) -> empty
            throw new IllegalStateException("주문 상품 정보가 누락되었습니다.");
        }
        Orders order = new Orders(member); // 아직 비어있는 주문 껍데기 만듦

        for(OrderItem orderItem : orderItems){ // 주문상품들 하나씩 채워주기
            order.addOrderItem(orderItem); //List 대입이 아니라, 메서드로 넣음
        }

        order.calculateTotalPrice(); //총 구매가격

        return order; // 생성한 주문서 반환

        /* 그동안은 값들을 내부 생성자를 통해서 다 넣고 바로 return new 객체를 해주었지만,
        지금은 내부 생성자 만들로 값을 채울 수 없음. 그래서 일단 new 객체로 빈 껍데기를 우선으로 만들고
        책임을 나눠서 하나씩 값을 채워 완성.
         */
    }


    // 목록에 주문상품 추가 메서드 -> 양방향 연관관계
    public void addOrderItem(OrderItem orderItem){
        if(orderItem == null){
            throw new IllegalStateException("주문 상품 정보가 누락되었습니다.");
        }
        this.orderItems.add(orderItem); // Order 입장에서 상품목록(orderItems) 추가
        orderItem.setOrders(this); // OrderItem입장에서 자신이 속할 Order 연결
    }

    // 총 구매가격 계산 메서드
    private void calculateTotalPrice(){
        int sum = 0;

        for(OrderItem orderItem : this.orderItems){
            sum += orderItem.getTotalPrice();
        }
        this.totalPrice = sum;
    }

    // 주문 취소 메서드
    public void cancel(){
        if (this.status == OrderStatus.CANCELED){
            throw new IllegalStateException("이미 취소된 주문입니다.");
        }
        this.status = OrderStatus.CANCELED;
        // 나중에 재고 복구 넣기
    }
}