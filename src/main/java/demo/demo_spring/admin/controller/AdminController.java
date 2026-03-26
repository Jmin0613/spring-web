package demo.demo_spring.admin.controller;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.dto.HotDealCreateRequest;
import demo.demo_spring.hotdeal.dto.HotDealFindResponse;
import demo.demo_spring.hotdeal.dto.HotDealUpdateRequest;
import demo.demo_spring.member.domain.Role;
import demo.demo_spring.member.dto.MemberFindAllResponse;
import demo.demo_spring.member.dto.MemberInfoResponse;
import jakarta.servlet.http.HttpSession;
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
    public MemberInfoResponse findOne(@PathVariable Long id, HttpSession session){

        Member member = memberService.findOne(id);
        return MemberInfoResponse.fromEntity(member); //dto
    }

    // 2. 회원 전체 조회 (Get)
    @GetMapping("/members")
    public List<MemberFindAllResponse> memberFindAll(HttpSession session){

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
    public Long save(@RequestBody HotDealCreateRequest request, HttpSession session){

        HotDeal hotDeal = request.toEntity(); //DTO -> Entity 변환
        Long id = hotDealService.save(hotDeal); // 서비스에서 레포지토리를 통해 데이터 저장
        return id;
    }

    // 2. 핫딜 전체 조회 (Get)
    @GetMapping("/hotdeals")
    public List<HotDealFindResponse> hotDealFindAll(HttpSession session){

        return hotDealService.findAll() //List<HotDeal>
                .stream() //stream<HotDeal>
                .map(HotDealFindResponse::fromEntity)//Stream<DTO>
                .toList(); //List<DTO>
    }

    // 3. 핫딜 업데이트 (Put)
    @PutMapping("/hotdeals/{id}")
    public void update(@PathVariable Long id, @RequestBody HotDealUpdateRequest request, HttpSession session){

        hotDealService.update(id, request);
    }

    //4. 핫딜 상품 삭제 (Delete)
    @DeleteMapping("/hotdeals/{id}")
    public void delete(@PathVariable Long id, HttpSession session){
        hotDealService.delete(id);
    }

}
/* 관리자 권한 체크하는 거에서 고민함.
"그냥 로그인할 때 이미 이 사람이 관리자인지 회원인지 판단해서 분리해주면 되지 않나?"
근데 권한 체크 자체를 로그인한 순만 가지고 끝낼 수는 없는거였음.
사용자가 로그인한 뒤에도 계속 여러 요청을 보내니간, 각 요청마다 이 요청을 사용자가 해도 되는지 다시 생각함.
-> 로그인은 한번이지만 인가(권한 체크)는 요청마다 필요함.

그리고 만약 url에 admin/members처럼 요청하면 연결될 수도있으니, 이것도 문제임.
로그인 후 role에 맞게 연결은 될지언정, url접근을 막지 못하면 보안 문제임.
또한 혹시 모르지. role이 바뀔수도?
그래서 매 요청마다 세션/권한을 기준으로 검사하는거라함.

백엔드 컨트롤러 메서드는 로그인할떄 연결되는게 아니라, 요청url들어올 때마다 선택됨.
로그인 성공 -> 세션에 사용자 정보 저장 -> 이후 요청 들어옴 -> url보고 해당 컨트롤러 메서드 호충 -> 그 메서드에 들어가도 되는지 검사
그러니깐 로그인 시점에 한 번으로 결정하면 안됨.
 */
