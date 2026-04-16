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
    private List<OrderItem> orderItems = new ArrayList<>(); //주문상품 목록

    private int totalPrice;

    @CreatedDate
    private LocalDateTime orderDate;

    @Enumerated(EnumType.STRING)
    private OrderStatus orderStatus;
    @Enumerated(EnumType.STRING)
    private DeliveryStatus deliveryStatus;

    @Embedded //@Embeddable로 정의된 객체 사용한다 선언
    private DeliveryInfo deliveryInfo;


    private Orders(Member member, DeliveryInfo deliveryInfo){
        // null 체크
        if (member == null){
            throw new IllegalStateException("구매자 정보가 누락되었습니다.");
        }
        this.member = member;
        this.orderStatus = OrderStatus.ORDERED;
        this.deliveryStatus = DeliveryStatus.READY;
        this.deliveryInfo = deliveryInfo;
    }

    // 주문서 생성 메서드
    public static Orders createOrder(Member member, List<OrderItem> orderItems, DeliveryInfo deliveryInfo){
        if(orderItems == null || orderItems.isEmpty()){
            throw new IllegalStateException("주문 상품 정보가 누락되었습니다.");
        }

        Orders order = new Orders(member, deliveryInfo);

        for(OrderItem orderItem : orderItems){
            order.addOrderItem(orderItem);
        }

        order.calculateTotalPrice(); //총 구매가격

        return order;
    }


    // 목록에 주문상품 추가 메서드 -> 양방향 연관관계
    public void addOrderItem(OrderItem orderItem){
        if(orderItem == null){
            throw new IllegalStateException("주문 상품 정보가 누락되었습니다.");
        }
        this.orderItems.add(orderItem); // Order 입장에서 상품목록(orderItems) 추가
        orderItem.setOrder(this); // OrderItem입장에서 자신이 속할 Order 연결
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
        if (this.orderStatus == OrderStatus.CANCELED){
            throw new IllegalStateException("이미 취소된 주문입니다.");
        }
        if (this.deliveryStatus != DeliveryStatus.READY){
            throw new IllegalStateException("배송 시작 이후에는 주문을 취소할 수 없습니다.");
        }

        for (OrderItem orderItems : this.orderItems){ // 취소 재고 복구
            orderItems.orderCancel();
        }

        this.orderStatus = OrderStatus.CANCELED;
        this.deliveryStatus = DeliveryStatus.CANCELED;
    }

    // 배송 상태 변경 메서드 - IN_DELIVERY
    public void startDelivery(){
        if(this.orderStatus == OrderStatus.CANCELED){
            throw new IllegalStateException("취소된 주문은 배송 처리할 수 없습니다,");
        }
        if(this.deliveryStatus != DeliveryStatus.READY){
            throw new IllegalStateException("배송 준비 상태에서만 배송 시작이 가능합니다.");
        }
        this.deliveryStatus = DeliveryStatus.IN_DELIVERY;
    }
    // 배송 상태 변경 메서드 - DELIVERED
    public void completeDelivery(){
        if(this.orderStatus == OrderStatus.CANCELED){
            throw new IllegalStateException("취소된 주문은 배송 완료 처리할 수 없습니다.");
        }
        if(this.deliveryStatus != DeliveryStatus.IN_DELIVERY){
            throw new IllegalStateException("배송 중인 상태에서만 배송 완료 처리가 가능합니다.");
        }
        this.deliveryStatus = DeliveryStatus.DELIVERED;
    }
    // READY도 확장해주기
}