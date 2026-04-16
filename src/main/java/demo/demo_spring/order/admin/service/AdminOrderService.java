package demo.demo_spring.order.admin.service;

import demo.demo_spring.order.admin.dto.AdminOrderDetailResponse;
import demo.demo_spring.order.admin.dto.AdminOrderListResponse;
import demo.demo_spring.order.domain.Orders;
import demo.demo_spring.order.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AdminOrderService {
    private final OrderRepository orderRepository;

    public AdminOrderService(OrderRepository orderRepository){
        this.orderRepository = orderRepository;
    }
    // 관리자 주문 전체 조회
    public List<AdminOrderListResponse> findOrders(){
        return orderRepository.findAllByOrderByOrderDateDesc()
                .stream().map(AdminOrderListResponse::fromEntity)
                .toList();
    }
    // 관리자 특정 주문 상세 조회
    public AdminOrderDetailResponse findOrderDetail(Long orderId){
        Orders order = orderRepository.findById(orderId)
                .orElseThrow(()-> new IllegalStateException("해당하는 주문이 없습니다."));
        return AdminOrderDetailResponse.fromEntity(order);
    }

    // 관리자 주문 및 배송 상태 변경
    public void startDelivery(Long orderId){
        Orders order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalStateException("해당하는 주문이 없습니다."));
        order.startDelivery();
    }
    public void completeDelivery(Long orderId){
        Orders order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalStateException("해당하는 주문이 없습니다."));
        order.completeDelivery();
    }
}
