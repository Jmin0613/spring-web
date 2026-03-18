package demo.demo_spring.controller;

import org.springframework.web.bind.annotation.*;
import demo.demo_spring.service.MemberService;
import demo.demo_spring.domain.Member;

import java.util.*;

//@estController -> api 서버. 데이터(json)바로 반환
//@Controller -> 화면 서버. 화면(html) 반환

// 현재 화면없이 서버에서 주고받기 때문에 RestController 사용
@RestController
public class MemberController {
    //웹 요청을 받아서 service로 전달하는 역할
    private final MemberService memberService = new MemberService();

    //회원 가입
    //@Post -> 주로 서버에 데이터를 전송하거나 자원을 생성할 때 사용
    @PostMapping("/members")
    public Long save(@RequestBody Member member){
        //클라이언트가 보낸 JSON → Member 객체로 변환
        return memberService.join(member);
        // 컨트롤러 -> 서비스 호출
        // 서비스에서 레포지토리를 통해 데이터 저장하고 반환
    }

    //회원 조회 - 개인
    //@Get -> 주로 데이터를 조회할 때 사용
    @GetMapping("/members/{id}")
    public Member findOne(@PathVariable Long id){
        //URL에서 id값 추출 (/members/1 -> id=1)
        return memberService.findOne(id);
        //서비스를 통해 id로 회원조회
    }

    //회원 전체 조회
    @GetMapping("/members")
    public List<Member> findAll(){
        //List로 회원 목록을 보여줌
        return memberService.findMembers();
        //레포지토리에서 Map을 List로 변환한 후 서비스를 통해 반환
    }
}
