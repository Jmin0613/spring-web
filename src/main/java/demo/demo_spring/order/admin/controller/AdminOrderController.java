package demo.demo_spring.order.admin.controller;

import demo.demo_spring.order.admin.dto.AdminOrderDeliveryStatusUpdateRequest;
import demo.demo_spring.order.admin.dto.AdminOrderDetailResponse;
import demo.demo_spring.order.admin.dto.AdminOrderListResponse;
import demo.demo_spring.order.admin.service.AdminOrderService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/orders") //다른 컨트롤러에도 적용하기 (리팩토링)
public class AdminOrderController {
    // 관리자 주문관리

    private final AdminOrderService adminOrderService;
    public AdminOrderController(AdminOrderService adminOrderService) {
        this.adminOrderService = adminOrderService;
    }

    // 관리자 주문목록 전체 조회
    @GetMapping
    public List<AdminOrderListResponse> findAllOrders(){
        return adminOrderService.findAllOrders();
    }

    // 관리자 특정주문 상세 조회
    @GetMapping("/{orderId}")
    public AdminOrderDetailResponse findOrderDetail(@PathVariable Long orderId){
        return adminOrderService.findOrderDetail(orderId);
    }

    // 관리자 배송상태 변경
    @PatchMapping("/{orderId}/delivery-status")
    public void updateDeliveryStatus(@PathVariable Long orderId,
                                     @RequestBody AdminOrderDeliveryStatusUpdateRequest request){
        adminOrderService.updateDeliveryStatus(orderId, request);
    }
}
