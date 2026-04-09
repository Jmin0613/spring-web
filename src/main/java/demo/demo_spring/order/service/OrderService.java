package demo.demo_spring.order.service;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.order.domain.OrderItem;
import demo.demo_spring.order.domain.Orders;
import demo.demo_spring.order.dto.OrderDetailResponse;
import demo.demo_spring.order.dto.OrderListResponse;
import demo.demo_spring.order.repository.OrderRepository;
import demo.demo_spring.product.domain.Product;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class OrderService {
    // 구매가 성공한 뒤 주문을 길고하는 서비스

    //Repository 주입 + DI
    private final OrderRepository orderRepository;
    private final MemberService memberService;

    public OrderService(OrderRepository orderRepository, MemberService memberService){
        this.orderRepository = orderRepository;
        this.memberService = memberService;
    }

    // 주문 생성 (지금은 단일. 후에 복수 상품으로 확장.)
    public Long create(Long memberId, Product product, int quantity, int orderPrice){
        // 구매할 상품목록 작성
        OrderItem orderItem = OrderItem.createOrderItem(product, quantity, orderPrice);

        // 주문서 작성
        Member member = memberService.getMember(memberId); // 캡슐화와 검증로직 재사용을 위해, member의 레포지토리가 아닌 서비스호출
        Orders order = Orders.createOrder(member, List.of(orderItem));
        // List.of(orderItem) -> 구매 상품목록 모두 추가한 후에는 변하면 안됨(구매 상품 확정)

        // 저장 + 주문번호 리턴
        order = orderRepository.save(order);
        return order.getId();
    }

    // 사용자 내 주문 조회
    public List<OrderListResponse> findMyOrders(Long memberId){
        return orderRepository.findOrderByMember_Id(memberId)
                .stream().map(OrderListResponse::fromEntity)
                .toList();
    }
    // 사용자 내 주문 상세 조회
    public OrderDetailResponse findOrder(Long orderId, Long memberId){
        Orders orders = orderRepository.findByIdAndMember_Id(orderId, memberId)
                .orElseThrow(()-> new IllegalStateException("해당하는 주문이 없습니다."));
        return OrderDetailResponse.fromEntity(orders);
    }

    // 주문 취소
}
