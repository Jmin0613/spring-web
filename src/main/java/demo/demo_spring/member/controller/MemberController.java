package demo.demo_spring.member.controller;

import demo.demo_spring.member.dto.*;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.member.domain.Member;

import java.util.List;

@RestController
public class MemberController {
    private final MemberService memberService;

    public MemberController(MemberService memberService){
        this.memberService = memberService;
    }

    //회원 가입
    @PostMapping("/members")
    public Long save(@RequestBody @Valid MemberCreateRequest request){
        return memberService.create(request);
    }

    // 회원가입 - 로그인id 중복확인
    @GetMapping("/members/check-login-id")
    public LoginIdCheckResponse checkLoginId(@RequestParam String loginId) {
        return memberService.checkLoginId(loginId);
    }

    //회원 로그인
    @PostMapping("/login")
    public String login(@RequestBody @Valid MemberLoginRequest request,
                        HttpSession session){
        //로그인id와 비밀번호 넘겨서 로그인
        Member member = memberService.login(request.getLoginId(), request.getPassword());

        //loginMember라는 이름으로 member객체를 서버에 저장
        session.setAttribute("loginMember", member); //세션 관리

        return "로그인 성공";
    }

    //로그아웃
    @PostMapping("/logout")
    public String logout(HttpSession session){
        session.invalidate();
        return "로그아웃 성공";
    }

    //내 정보 조회
    @GetMapping("/members/myinfo")
    public ResponseEntity<MemberInfoResponse> myInfo(HttpSession session) {
        Member loginMember = (Member) session.getAttribute("loginMember");

        if (loginMember == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(MemberInfoResponse.fromEntity(loginMember));
    }
    //--------------->
    // 이런 인증체크 나중가서 더 많아지면 컨트롤러마다 일일이 귀찮으니
    // 인터셉터나 스프링 시큐리티로 인증체크 리팩토링해주기

    // 관리자용 회원 전체 조회
    @GetMapping("/admin/members")
    public List<MemberFindResponse> adminFindAllMembers() {return memberService.adminFindAllMembers();}

    // 관리자용 회원 단건 조회
    @GetMapping("/admin/members/{memberId}")
    public MemberFindResponse adminFindMember(@PathVariable Long memberId){
        return memberService.adminFindMember(memberId);
    }
}