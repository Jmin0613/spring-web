package demo.demo_spring.hotdeal.controller;

import demo.demo_spring.hotdeal.dto.AdminHotDealDetailResponse;
import demo.demo_spring.hotdeal.dto.AdminHotDealListResponse;
import demo.demo_spring.hotdeal.dto.HotDealCreateRequest;
import demo.demo_spring.hotdeal.dto.HotDealUpdateRequest;
import demo.demo_spring.hotdeal.service.HotDealService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
public class AdminHotDealController {
    //생성자주입 + di
    private final HotDealService hotDealService;
    public AdminHotDealController(HotDealService hotDealService){
        this.hotDealService = hotDealService;
    }

    // 등록
    @PostMapping("/admin/hotdeals")
    public Long create(@RequestBody @Valid HotDealCreateRequest request){
        return hotDealService.create(request); //등록한 핫딜의 id값 반환
    }

    // 수정
    @PatchMapping("/admin/hotdeals/{id}")
    public void update(@PathVariable Long id, @RequestBody HotDealUpdateRequest request){
        hotDealService.update(id, request);
    }

    // 긴급 중단
    @PatchMapping("/admin/hotdeals/{id}/stop")
    public void stop(@PathVariable Long id){
        hotDealService.adminEmergencyStop(id);
    }

    // 중단 재개
    @PatchMapping("/admin/hotdeals/{id}/resume")
    public void resume(@PathVariable Long id){ hotDealService.adminResume(id);}

    // 삭제
    @DeleteMapping("/admin/hotdeals/{id}")
    public void delete(@PathVariable Long id){
        hotDealService.delete(id);
    }

    // 전체 조회
    @GetMapping("/admin/hotdeals")
    public List<AdminHotDealListResponse> adminFindAllHotDeal(){
        return hotDealService.adminFindAllHotDeal();
    }

    // 단건 조회
    @GetMapping("/admin/hotdeals/{id}")
    public AdminHotDealDetailResponse adminFindHotDeal(@PathVariable Long id){
        return hotDealService.adminFindHotDeal(id);
    }
}
