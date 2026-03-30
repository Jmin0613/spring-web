package demo.demo_spring.hotdeal.controller;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.dto.HotDealListResponse;
import demo.demo_spring.hotdeal.service.HotDealService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class HotDealController {

    //클라이언트(web) 요청 받아서 service로 넘길 객체 생성
    private final HotDealService hotDealService;

    //생성자주입 + di
    public HotDealController(HotDealService hotDealService){
        this.hotDealService = hotDealService;
    }

    // 1. 핫딜 전체 조회 (Get)
    @GetMapping("/hotdeals")
    public List<HotDealListResponse> findAll(){
        return hotDealService.findAll() //List<HotDeal>
                .stream() //stream<HotDeal>
                .map(HotDealListResponse::fromEntity)//Stream<DTO>
                .toList(); //List<DTO>
    }

    // 2. 핫딜 단건 조회 (Get)
    @GetMapping("/hotdeals/{id}")
    public HotDealListResponse findById(@PathVariable Long id){ //URL에서 id값 추출
        HotDeal hotDeal = hotDealService.findById(id); //꺼내오기
        return HotDealListResponse.fromEntity(hotDeal); //DTO처리해서 보내주기
    }

    // 3. 핫딜 구매 (Post)
    @PostMapping("/hotdeals/{id}/buy")
    public String buy(@PathVariable Long id, HttpSession session){
        hotDealService.buy(id); //사오기
        return "구매 성공";
    }
}