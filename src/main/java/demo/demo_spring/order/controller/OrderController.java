package demo.demo_spring.order.controller;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.order.dto.OrderDetailResponse;
import demo.demo_spring.order.dto.OrderListResponse;
import demo.demo_spring.order.service.OrderService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // 내 주문 목록 조회
    @GetMapping("/orders")
    public List<OrderListResponse> findMyOrders(HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        return orderService.findMyOrders(loginMember.getId());
    }

    // 내 주문 상세 조회
    @GetMapping("/orders/{id}")
    public OrderDetailResponse findOrder(@PathVariable Long id,
                                         HttpSession session){
        Member loginMember = (Member)session .getAttribute("loginMember");
        return orderService.findOrder(id,loginMember.getId());
    }
    // -------> 이 부분 mypage쪽으로 통합하는거 리팩토링 염두하기
    // 대신 adminOrderController만들어서 관리자 전용 조회 만들기
}
