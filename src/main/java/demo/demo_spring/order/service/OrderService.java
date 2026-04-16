package demo.demo_spring.order.service;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.order.domain.OrderItem;
import demo.demo_spring.order.domain.Orders;
import demo.demo_spring.order.admin.dto.AdminOrderDetailResponse;
import demo.demo_spring.order.admin.dto.AdminOrderListResponse;
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

    public OrderService(OrderRepository orderRepository){
        this.orderRepository = orderRepository;
    }

    // 주문 생성 (지금은 단일. 후에 복수 상품으로 확장 리팩토링)
    public Long create(Member member, Product product, int quantity, int orderPrice){
        // 구매할 상품목록 작성
        OrderItem orderItem = OrderItem.createOrderItem(product, quantity, orderPrice);

        // 주문서 작성
        Orders order = Orders.createOrder(member, List.of(orderItem));
        // List.of(orderItem) -> 구매 상품목록 모두 추가한 후에는 변하면 안됨(구매 상품 확정)

        // 저장 + 주문번호 리턴
        order = orderRepository.save(order);
        return order.getId();
    }

    // 주문 취소 -> 리팩토링
}
