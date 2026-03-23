package demo.demo_spring.member.controller;

import demo.demo_spring.member.dto.MemberCreateRequest;
import demo.demo_spring.member.dto.MemberFindAllResponse;
import demo.demo_spring.member.dto.MemberLoginRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.member.domain.Member;

import java.util.List;

@RequestMapping("/admin")
public class AdminController {
    // 회원 목록 조회, 회원 단건 조회, 상품 등록/수정/삭제, 핫딜 등록/수정/삭제

    private final MemberService memberService;

    public AdminController(MemberService memberService){
        this.memberService = memberService;
    } // Service 주세요~ (DI 받는 중)

    //회원 단건 조회
    //@Get -> 주로 데이터를 조회할 때 사용
    @GetMapping("/members/{id}")
    public Member findOne(@PathVariable Long id){
        //URL에서 id값 추출 (/members/1 -> id=1)
        return memberService.findOne(id);
        //서비스를 통해 id로 회원조회
    }

    //회원 전체 조회
    @GetMapping("/members")
    public List<MemberFindAllResponse> findAll(){
        return memberService.findMembers() //이걸로 받은 List는 List<Member>
                .stream() //순차적으로. 여기서 타입은 Stream<Member>임.
                .map(MemberFindAllResponse::fromEntity)
                //하나씩 꺼내서 DTO로 바꿔줌. 근데 아직 Stream<DTO>임. 리스트 변환 필요
                .toList();//그래서 DTO로 바꾸고 다시 List<DTO>변환 후, 불변 리스트로 반환
        //stream().map().toList() -> 순차적으로 DTO변환 후 불변(Immutable) 리스트로 반환
    }
}
