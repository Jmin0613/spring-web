package demo.demo_spring.admin.controller;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.dto.HotDealCreateRequest;
import demo.demo_spring.hotdeal.dto.HotDealFindResponse;
import demo.demo_spring.hotdeal.dto.HotDealUpdateRequest;
import demo.demo_spring.member.dto.MemberFindAllResponse;
import demo.demo_spring.member.dto.MemberInfoResponse;
import org.springframework.web.bind.annotation.*;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.member.domain.Member;
import demo.demo_spring.hotdeal.service.HotDealService;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final MemberService memberService;
    private final HotDealService hotDealService;

    public AdminController(MemberService memberService, HotDealService hotDealService){
        this.memberService = memberService;
        this.hotDealService = hotDealService;
    } // Service 주세요~ (DI 받는 중)


    // 회원 목록 조회, 회원 단건 조회
    // 1. 회원 단건 조회 (Get)
    @GetMapping("/members/{id}")
    public MemberInfoResponse findOne(@PathVariable Long id){
        Member member = memberService.findOne(id);
        return MemberInfoResponse.fromEntity(member); //dto
    }

    // 2. 회원 전체 조회 (Get)
    @GetMapping("/members")
    public List<MemberFindAllResponse> memberFindAll(){
        return memberService.findMembers() //이걸로 받은 List는 List<Member>
                .stream() //순차적으로. 여기서 타입은 Stream<Member>임.
                .map(MemberFindAllResponse::fromEntity)
                //하나씩 꺼내서 DTO로 바꿔줌. 근데 아직 Stream<DTO>임. 리스트 변환 필요
                .toList();//그래서 DTO로 바꾸고 다시 List<DTO>변환 후, 불변 리스트로 반환
        //stream().map().toList() -> 순차적으로 DTO변환 후 불변(Immutable) 리스트로 반환
    }

    // 상품 등록/수정/삭제, 핫딜 등록/수정/삭제
    // 1. 핫딜 등록 (Post)
    @PostMapping("/hotdeals")
    public Long save(@RequestBody HotDealCreateRequest request){
        HotDeal hotDeal = request.toEntity(); //DTO -> Entity 변환
        Long id = hotDealService.save(hotDeal); // 서비스에서 레포지토리를 통해 데이터 저장
        return id;
    }

    // 2. 핫딜 전체 조회 (Get)
    @GetMapping("/hotdeals")
    public List<HotDealFindResponse> hotDealFindAll(){
        return hotDealService.findAll() //List<HotDeal>
                .stream() //stream<HotDeal>
                .map(HotDealFindResponse::fromEntity)//Stream<DTO>
                .toList(); //List<DTO>
    }

    // 3. 핫딜 업데이트 (Put)
    @PutMapping("/hotdeals/{id}")
    public void update(@PathVariable Long id, @RequestBody HotDealUpdateRequest request){
        hotDealService.update(id, request);
        //반환값 필요x
    }

    //4. 핫딜 상품 삭제 (Delete)
    @DeleteMapping("/hotdeals/{id}")
    public void delete(@PathVariable Long id){
        hotDealService.delete(id);
    }

}
