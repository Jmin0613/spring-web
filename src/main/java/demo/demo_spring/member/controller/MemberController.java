package demo.demo_spring.member.controller;

import demo.demo_spring.member.dto.MemberCreateRequest;
import demo.demo_spring.member.dto.MemberInfoResponse;
import demo.demo_spring.member.dto.MemberLoginRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.member.domain.Member;

import java.net.URI;

@RestController
public class MemberController {
    private final MemberService memberService;

    public MemberController(MemberService memberService){
        this.memberService = memberService;
    } // Service 주세요~ (DI 받는 중)

    //회원 가입
    @PostMapping("/members")
    public ResponseEntity<Long> save(@RequestBody MemberCreateRequest request){
        Member member = request.toEntity(); //DTO -> Entity 변환
        Long id = memberService.join(member); // 서비스에서 레포지토리를 통해 데이터 저장

        // return ResponseEntity.ok(id); -> 회원가입 성공하면 ok반환. 반환 타입 : ResponseEntity<Long>
        //return ResponseEntity.created(URI.create("/members/"+id)); -> 성공하면 created 반환
        // 근데 여기서반환되는 타입 BodyBuilder임. 그래서 반환타입 안맞아서 에러.
        // return ResponseEntity.created(URI.create("/members/"+id)).build(); 그래서 build()
        // 근데 이렇게 쓰면 나중에 프론트엔드가 body가 없어서 힘들다함.
        return ResponseEntity.created(URI.create("/members/"+id)).body(id); //그래서 이렇게 씀
    }

    //회원 로그인
    @PostMapping("/login")
    public String login(@RequestBody MemberLoginRequest request,
                        HttpSession session){
        //로그인id와 비밀번호 넘겨서 로그인
        Member member = memberService.login(request.getLoginId(), request.getPassword());

        session.setAttribute("loginMember", member); //세션 관리
        //loginMember라는 이름으로 member객체를 서버에 저장

        return "로그인 성공"; //로그인 성공시 메세지
    }

    //로그아웃
    @PostMapping("/logout")
    public String logout(HttpSession session){
        session.invalidate();
        return "로그아웃 성공";
    }

    //내 정보 조회
    @GetMapping("/members/myinfo")
    public MemberInfoResponse myInfo(HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");

        if(loginMember == null){
            throw new IllegalStateException("로그인이 필요합니다");
        }
        // 세션에 이미 있는데 한번 더 회원 정보를 확인하는 이유
        // db 기준 회신 상태 응답을 위해.
        // 로그인 한 후에, 비밀번호나 이메일 바꿧을 수도 있으니간.
        // DB가 바뀌었다고 세션 객체가 자동으로 같이 바뀌진 않음.
        // 세션은 단지 서버가 "이 사용자는 로그인한 상태"라는 것을 기억하는거지, db랑 실시간 동기화는 아님.
        // ------> 웹 요청/인증 상태 검사는 서비스로 안넘기고 컨트롤러에서. 이경우 세션이라는 웹기술.

        Member member = memberService.findOne(loginMember.getId());
        return MemberInfoResponse.fromEntity(member); //dto
    }
}