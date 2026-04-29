package demo.demo_spring.order.admin.service;

import demo.demo_spring.order.admin.dto.AdminOrderDeliveryStatusUpdateRequest;
import demo.demo_spring.order.admin.dto.AdminOrderDetailResponse;
import demo.demo_spring.order.admin.dto.AdminOrderListResponse;
import demo.demo_spring.order.domain.DeliveryStatus;
import demo.demo_spring.order.domain.Orders;
import demo.demo_spring.order.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AdminOrderService {
    // 관리자 주문관리 서비스

    private final OrderRepository orderRepository;
    public AdminOrderService(OrderRepository orderRepository){
        this.orderRepository = orderRepository;
    }

    // 관리자 주문목록 전체 조회
    public List<AdminOrderListResponse> findAllOrders(){
        return orderRepository.findAllByOrderByOrderDateDesc()
                .stream().map(AdminOrderListResponse::fromEntity)
                .toList();
    }
    // 관리자 특정주문 상세 조회
    public AdminOrderDetailResponse findOrderDetail(Long orderId){
        Orders order = orderRepository.findById(orderId)
                .orElseThrow(()-> new IllegalStateException("해당하는 주문이 없습니다."));
        return AdminOrderDetailResponse.fromEntity(order);
    }

    // 관리자 배송상태 변경
    public void updateDeliveryStatus(Long orderId, AdminOrderDeliveryStatusUpdateRequest request){
        // 해당 주문 찾기
        Orders order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalStateException("해당하는 주문이 없습니다."));

        DeliveryStatus targetOrderStatus = request.getDeliveryStatus();

        // 배송상태 요청 null체크
        if(targetOrderStatus == null){
            throw new IllegalStateException("변경할 배송상태를 선택해주세요.");
        }

        // 같은 상태 요청 시, 통과
        if(targetOrderStatus == order.getDeliveryStatus()){
            return;
        }

        // (배송중 요청) 배송준비중READY -> 배송중IN_DELIVERY
        if(targetOrderStatus == DeliveryStatus.IN_DELIVERY){
            order.startDelivery();
        }

        // (배송완료 요청) 배송중IN_DELIVERY -> 배송완료DELIVERED
        if(targetOrderStatus == DeliveryStatus.DELIVERED){
            order.completeDelivery();
        }

    }
}
