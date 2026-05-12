package demo.demo_spring.hotdeal.controller;

import demo.demo_spring.hotdeal.dto.AdminHotDealDetailResponse;
import demo.demo_spring.hotdeal.dto.AdminHotDealListResponse;
import demo.demo_spring.hotdeal.dto.HotDealCreateRequest;
import demo.demo_spring.hotdeal.dto.HotDealUpdateRequest;
import demo.demo_spring.hotdeal.service.HotDealService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/admin/hotdeals")
@RequiredArgsConstructor
public class AdminHotDealController {

    private final HotDealService hotDealService;

    // 등록
    @PostMapping
    public Long create(@RequestBody @Valid HotDealCreateRequest request){
        return hotDealService.create(request);
    }

    // 수정
    @PatchMapping("/{hotDealId}")
    public void update(@PathVariable Long hotDealId, @RequestBody HotDealUpdateRequest request){
        hotDealService.update(hotDealId, request);
    }

    // 긴급 중단
    @PatchMapping("{hotDealId}/stop")
    public void stop(@PathVariable Long hotDealId){
        hotDealService.adminEmergencyStop(hotDealId);
    }

    // 중단 재개
    @PatchMapping("/{hotDealId}/resume")
    public void resume(@PathVariable Long hotDealId){ hotDealService.adminResume(hotDealId);}

    // 삭제
    @DeleteMapping("/{hotDealId}")
    public void delete(@PathVariable Long hotDealId){
        hotDealService.delete(hotDealId);
    }

    // 전체 조회
    @GetMapping
    public List<AdminHotDealListResponse> adminFindAllHotDeal(){
        return hotDealService.adminFindAllHotDeal();
    }

    // 단건 조회
    @GetMapping("/{hotDealId}")
    public AdminHotDealDetailResponse adminFindHotDeal(@PathVariable Long hotDealId){
        return hotDealService.adminFindHotDeal(hotDealId);
    }
}
