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
    /*  Orders 역할 :
           PENDING_PAYMENT 주문 생성
           결제 성공 시 PAID 확정
           결제 만료 시 EXPIRED 처리
           결제 완료 후 취소 시 CANCELED 처리
    */

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

    private LocalDateTime paymentExpiresAt; //결제 만료 시간. (결제준비api 호출시점 + 10min)

    @Enumerated(EnumType.STRING)
    private OrderStatus orderStatus;
    @Enumerated(EnumType.STRING)
    private DeliveryStatus deliveryStatus;

    @Embedded //@Embeddable로 정의된 객체 사용한다 선언
    private DeliveryInfo deliveryInfo;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod; //결제 수단


    private Orders(Member member, DeliveryInfo deliveryInfo, PaymentMethod paymentMethod,
                   OrderStatus orderStatus, LocalDateTime paymentExpiresAt){
        // null 체크
        if(member == null){
            throw new IllegalStateException("구매자 정보가 누락되었습니다.");
        }
        if(deliveryInfo == null){
            throw new IllegalStateException("배송 정보가 누락되었습니다.");
        }
        if(paymentMethod == null){
            throw new IllegalStateException("결제 수단이 누락되었습니다.");
        }
        if(orderStatus == null){
            throw new IllegalStateException("주문 상태가 누락되었습니다.");
        }

        this.member = member;
        this.deliveryInfo = deliveryInfo;

        this.paymentMethod = paymentMethod;

        this.orderStatus = orderStatus;
        this.deliveryStatus = DeliveryStatus.READY; //기본값 : 배송 준비중
        this.paymentExpiresAt = paymentExpiresAt;
    }

    // (기존) 주문서 생성 메서드 -> 나중에 흐름 완성하면 삭제하기.
    public static Orders createOrder(Member member, List<OrderItem> orderItems,
                                     DeliveryInfo deliveryInfo, PaymentMethod paymentMethod){
        if(orderItems == null || orderItems.isEmpty()){
            throw new IllegalStateException("주문 상품 정보가 누락되었습니다.");
        }

        Orders order = new Orders(member, deliveryInfo, paymentMethod, OrderStatus.PAID, null);
        // orderStatus=PAID 고정안하고, orderStatus 파라미터로 넘긴 이유
        // -> 같은 생성자를 PAID 주문과 PENDING_PAYMENT 주문 둘 다 만들때 재사용할려고.

        // 주문서에 주문상품 넣기
        for(OrderItem orderItem : orderItems){
            order.addOrderItem(orderItem);
        }

        //총 구매가격 계산
        order.calculateTotalPrice();

        for(OrderItem orderItem : order.orderItems){
            orderItem.confirmPurchase(); // 결제 성공 시 구매수 증가 확정
        }

        return order;
    }

    //Port One 결제 준비용 : 결제 대기 주문 생성 + 재고 선점
    public static Orders createPendingPaymentOrder(Member member, List<OrderItem> orderItems,
                                                   DeliveryInfo deliveryInfo, PaymentMethod paymentMethod,
                                                   LocalDateTime paymentExpiresAt){
        if(orderItems == null || orderItems.isEmpty()){
            throw new IllegalStateException("주문 상품 정보가 누락되었습니다.");
        }
        if(paymentExpiresAt == null){
            throw new IllegalStateException("결제 만료 시간이 누락되었습니다.");
        }

        // pending 주문 생성
        Orders order = new Orders(
                member, deliveryInfo, paymentMethod, OrderStatus.PENDING_PAYMENT, paymentExpiresAt
        );

        // 주문서에 주문상품 넣기
        for(OrderItem orderItem : orderItems){
            order.addOrderItem(orderItem);
        }

        // 결제 대기 단계에서 재고 선점
        // PRODUCT -> DB에서 재고 선점.
        // HOTDEAL -> PaymentService에서 Redis로 재고 선점.
        for(OrderItem orderItem : order.orderItems){
            orderItem.reserveStock();
        }

        // 총 결제금액 게산
        order.calculateTotalPrice();

        // pending 주문 생성한 것 반환
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

    // 결제 성공 검증 후 주문 확정
    public void markAsPaid(LocalDateTime now){
        if(now == null){
            throw new IllegalStateException("현재 시간이 누락되었습니다.");
        }
        if(this.orderStatus != OrderStatus.PENDING_PAYMENT){
            throw new IllegalStateException("결제 대기 주문만 결제 완료 처리할 수 있습니다.");
        }
        if(isPaymentExpired(now)){
            throw new IllegalStateException("결제 시간이 만료된 주문입니다.");
        }

        // 결제 성공 시, 각 주문상품마다 구매수 증가
        for(OrderItem orderItem : this.orderItems){
            orderItem.confirmPurchase();
        }

        // 주문상태 -> 결제완료.
        this.orderStatus = OrderStatus.PAID;

    }

    // 결제 대기 만료 처리 -> 선점 재고 복구
    public void expirePayment(LocalDateTime now){
        if(now == null){
            throw new IllegalStateException("현재 시간이 누락되었습니다.");
        }
        if(this.orderStatus != OrderStatus.PENDING_PAYMENT){
            throw new IllegalStateException("결제 대기 주문만 만료 처리할 수 있습니다.");
        }

        // 재고복구 + 상태복구
        for(OrderItem orderItem : this.orderItems){
            orderItem.restoreReservedStock(now);
        }

        // 주문상태 -> 만료. 배송상태 -> 취소.
        this.orderStatus = OrderStatus.EXPIRED;
        this.deliveryStatus = DeliveryStatus.CANCELED;
    }
    // 주문 취소 메서드
    public void cancel(LocalDateTime now){
        if (now == null) {
            throw new IllegalStateException("현재 시간이 누락되었습니다.");
        }
        if (this.orderStatus == OrderStatus.CANCELED){
            throw new IllegalStateException("이미 취소된 주문입니다.");
        }
        if (this.orderStatus != OrderStatus.PAID) {
            throw new IllegalStateException("결제 완료 주문만 취소할 수 있습니다.");
        }
        if (this.deliveryStatus != DeliveryStatus.READY){
            throw new IllegalStateException("배송 시작 이후에는 주문을 취소할 수 없습니다.");
        }

        // 취소 재고 복구
        for (OrderItem orderItem : this.orderItems){
            orderItem.cancelPaidOrder(now);
        }

        // 주문상태 -> 취소. 배송상태 -> 취소.
        this.orderStatus = OrderStatus.CANCELED;
        this.deliveryStatus = DeliveryStatus.CANCELED;
    }

    // 결제 시간 만료
    public boolean isPaymentExpired(LocalDateTime now){
        // Pending 주문 상태 맞는지 확인 (결제 대기)
        if(this.orderStatus != OrderStatus.PENDING_PAYMENT){
            return false;
        }
        // 만료시간 null 체크
        if(this.paymentExpiresAt == null){
            return false;
        }

        // 결제 대기중인데, 결제 제한 시간 지났는지 체크 (제한시간 이후인지 || 지금이 제한시간인지)
        return now.isAfter(this.paymentExpiresAt) || now.isEqual(this.paymentExpiresAt);
    }

    // 배송 상태 변경 메서드 - IN_DELIVERY
    public void startDelivery(){
        if(this.orderStatus != OrderStatus.PAID){
            throw new IllegalStateException("결제 완료된 주문만 배송 처리할 수 있습니다.");
        }
        if(this.deliveryStatus != DeliveryStatus.READY){
            throw new IllegalStateException("배송 준비 상태에서만 배송 시작이 가능합니다.");
        }
        this.deliveryStatus = DeliveryStatus.IN_DELIVERY;
    }
    // 배송 상태 변경 메서드 - DELIVERED
    public void completeDelivery(){
        if(this.orderStatus != OrderStatus.PAID){
            throw new IllegalStateException("결제 완료된 주문만 배송 완료 처리할 수 있습니다.");
        }
        if(this.deliveryStatus != DeliveryStatus.IN_DELIVERY){
            throw new IllegalStateException("배송 중인 상태에서만 배송 완료 처리가 가능합니다.");
        }
        this.deliveryStatus = DeliveryStatus.DELIVERED;
    }
    // READY도 확장해주기
}