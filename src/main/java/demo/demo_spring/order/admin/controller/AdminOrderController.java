package demo.demo_spring.order.admin.controller;

import demo.demo_spring.order.admin.dto.AdminOrderDetailResponse;
import demo.demo_spring.order.admin.dto.AdminOrderListResponse;
import demo.demo_spring.order.admin.service.AdminOrderService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class AdminOrderController {
    private final AdminOrderService adminOrderService;

    public AdminOrderController(AdminOrderService adminOrderService) {
        this.adminOrderService = adminOrderService;
    }

    // 관리자 주문 조회
    @GetMapping("/admin/orders")
    public List<AdminOrderListResponse> findOrders(){
        return adminOrderService.findOrders();
    }

    // 관리자 주문 상세 조회
    @GetMapping("/admin/orders/{orderId}")
    public AdminOrderDetailResponse findOrderDetail(@PathVariable Long orderId){
        return adminOrderService.findOrderDetail(orderId);
    }

    // 배송 상태 변경
    @PatchMapping("/admin/orders/{orderId}/delivery/start")
    public void AdminStartDelivery(@PathVariable Long orderId){
        adminOrderService.startDelivery(orderId);

    }
    @PatchMapping("admin/orders/{orderId}/delivery/compelte")
    public void AdminCompleteDelivery(@PathVariable Long orderId){
        adminOrderService.completeDelivery(orderId);
    }
}
