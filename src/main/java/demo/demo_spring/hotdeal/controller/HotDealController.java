package demo.demo_spring.hotdeal.controller;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.dto.HotDealCreateRequest;
import demo.demo_spring.hotdeal.dto.HotDealFindResponse;
import demo.demo_spring.hotdeal.dto.HotDealUpdateRequest;
import demo.demo_spring.hotdeal.repository.HotDealRepository;
import demo.demo_spring.hotdeal.service.HotDealService;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class HotDealController {

    //클라이언트(web) 요청 받아서 service로 넘길 객체 생성
    private final HotDealService hotDealService;
    private final HotDealRepository hotDealRepository;

    //생성자주입 + di
    public HotDealController(HotDealService hotDealService, HotDealRepository hotDealRepository){
        this.hotDealService = hotDealService;
        this.hotDealRepository = hotDealRepository;
    }

    // 1. 핫딜등록(Post)
    @PostMapping("/hotdeals")
    public Long save(@RequestBody HotDealCreateRequest request){
        HotDeal hotDeal = request.toEntity(); //DTO -> Entity 변환
        Long id = hotDealService.save(hotDeal); // 서비스에서 레포지토리를 통해 데이터 저장
        return id;
    }

    // 2. 핫딜 전체 조회 (Get) -> 고객 기준
    @GetMapping("/hotdeals")
    public List<HotDealFindResponse> findAll(){
        return hotDealService.findAll() //List<HotDeal>
                .stream() //stream<HotDeal>
                .map(HotDealFindResponse::fromEntity)//Stream<DTO>
                .toList(); //List<DTO>
    }

    // 3. 핫딜 단건 조회 (Get) -> 고객 기준
    @GetMapping("/hotdeals/{id}")
    public HotDealFindResponse findById(@PathVariable long id){ //URL에서 id값 추출
        HotDeal hotDeal = hotDealService.findById(id); //꺼내오기
        return HotDealFindResponse.fromEntity(hotDeal); //DTO처리해서 보내주기
    }

    // 4. 핫딜 구매 (Post)
    @PostMapping("/hotdeals/{id}/buy")
    public String buy(@PathVariable long id){
        hotDealService.buy(id); //사오기
        return "구매 성공";
    }

    // 5. 핫딜 업데이트. PUT -> 수정
    @PutMapping("/hotdeals/{id}")
    public void update(@PathVariable long id, @RequestBody HotDealUpdateRequest request){
        hotDealService.update(id, request);
        //반환값 필요x
    }
}
