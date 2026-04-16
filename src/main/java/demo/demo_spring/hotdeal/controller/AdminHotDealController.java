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
    @PatchMapping("/admin/hotdeals/{hotDealId}")
    public void update(@PathVariable Long hotDealId, @RequestBody HotDealUpdateRequest request){
        hotDealService.update(hotDealId, request);
    }

    // 긴급 중단
    @PatchMapping("/admin/hotdeals/{hotDealId}/stop")
    public void stop(@PathVariable Long hotDealId){
        hotDealService.adminEmergencyStop(hotDealId);
    }

    // 중단 재개
    @PatchMapping("/admin/hotdeals/{hotDealId}/resume")
    public void resume(@PathVariable Long hotDealId){ hotDealService.adminResume(hotDealId);}

    // 삭제
    @DeleteMapping("/admin/hotdeals/{hotDealId}")
    public void delete(@PathVariable Long hotDealId){
        hotDealService.delete(hotDealId);
    }

    // 전체 조회
    @GetMapping("/admin/hotdeals")
    public List<AdminHotDealListResponse> adminFindAllHotDeal(){
        return hotDealService.adminFindAllHotDeal();
    }

    // 단건 조회
    @GetMapping("/admin/hotdeals/{hotDealId}")
    public AdminHotDealDetailResponse adminFindHotDeal(@PathVariable Long hotDealId){
        return hotDealService.adminFindHotDeal(hotDealId);
    }
}
