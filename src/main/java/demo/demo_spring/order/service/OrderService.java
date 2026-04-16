package demo.demo_spring.order.service;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.order.domain.DeliveryInfo;
import demo.demo_spring.order.domain.OrderItem;
import demo.demo_spring.order.domain.Orders;
import demo.demo_spring.order.repository.OrderRepository;
import demo.demo_spring.product.domain.Product;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class  OrderService {
    // 구매가 성공한 뒤 주문을 생성하는 서비스

    private final OrderRepository orderRepository;
    private final MemberService memberService;

    public OrderService(OrderRepository orderRepository, MemberService memberService){
        this.orderRepository = orderRepository;
        this.memberService = memberService;
    }

    // 주문 생성 - HotDeal 즉시 구매 + Product 즉시 구매
    public Long createSingle(Member member, Product product, int quantity, int orderPrice, DeliveryInfo deliveryInfo){
        // 구매할 상품목록 작성
        OrderItem orderItem = OrderItem.createOrderItem(product, quantity, orderPrice);

        // 주문서 작성 + 저장 넘겨주기
        return create(member, List.of(orderItem), deliveryInfo); //구매확정 -> 불변
    }

    // 주문 생성 - Product 다건주문 구매
    public Long create(Member member, List<OrderItem> orderItems, DeliveryInfo deliveryInfo){
        // 주문서 작성
        Orders order = Orders.createOrder(member, orderItems, deliveryInfo);

        // 저장 + 주문번호 리턴
        Orders savedOrder = orderRepository.save(order);
        return savedOrder.getId();
    }

    // 주문 취소
    public void cancel(Long orderId, Long memberId){
        // 회원 조회
        memberService.getMember(memberId);

        // 특정회원+특정주문 꺼내오기
        Orders order = orderRepository.findByIdAndMemberId(orderId, memberId)
                .orElseThrow(()-> new IllegalStateException("해당하는 주문이 없습니다."));

        order.cancel();
    }
}
