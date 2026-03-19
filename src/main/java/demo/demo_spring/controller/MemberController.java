package demo.demo_spring.controller;

import demo.demo_spring.dto.MemberCreateRequest;
import demo.demo_spring.dto.MemberLoginRequest;
import jakarta.servlet.http.HttpSession;
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
    //private final MemberService memberService = new MemberService();
    // -> 이거 MemberService 바뀌면서 생성자 파라미터 필요 때문에 에러생길거임.
    private final MemberService memberService;

    public MemberController(MemberService memberService){
        this.memberService = memberService;
    } // Service 주세요~ (DI 받는 중)

    //회원 가입
    //@Post -> 주로 서버에 데이터를 전송하거나 자원을 생성할 때 사용
    @PostMapping("/members")
    public Long save(@RequestBody MemberCreateRequest request){
        Member member = request.toEntity(); //DTO -> Entity 변환
        return memberService.join(member);
        // 서비스에서 레포지토리를 통해 데이터 저장하고 반환
        //회원가입 후 생성된 id 반환
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

    //회원 로그인 -> 일단 name으로 로그인하게 간단히 구현
    @PostMapping("/login")
    public String login(@RequestBody MemberLoginRequest request,
                        HttpSession session){
        //session -> 사용자 상태를 서버가 기억하는 공간.
        //HttpSession -> spring에서 제공하는 세션을 다루는 객체. 로그인 정보를 저장하는 서버쪽 저장소.

        Member member = memberService.login(request.getName()); //name넣어서 로그인

        if(member == null){ //조회되는 회원이 없음
            throw new IllegalStateException("회원이 없습니다."); //로그인 안된다고 에러 던지기
        }
        session.setAttribute("loginMember", member); //세션 관리
        //loginMember라는 이름으로 member객체를 서버에 저장

        return "login success"; //로그인 성공시 메세지
    }
}
/* 세션session 이란? 서버가 "아, 이사람 아까 그 사람이구나!"하고 기억하기 위해 서버 메모리에 적어 두는 메모장
    -> 세션은 서버에 저장되고, 클라이언트는 세션ID만 가짐
 필요한 이유 : HTTP통신은 Stateless(무상태) 성질을 가짐
 그래서 서버는 클라이언트의 요청이 끝나면 바로 잊어버림.
 만약 세션이 없다면, 쇼핑몰에서 상품 클릭할떄마다 매번 다시 로그인해야함 -> 로그인 상태 유지에 꼭 필요!

 세션의 작동 원리
   로그인: 사용자(회원)가 id,password 보냄
   발급: 서버가 확인 후, 서버 메모리에 정보를 저장하고 "세션 ID(열쇠)"를 하나 만듦.
   전달: 서버는 이 세션 ID를 클라이언트(브라우저)에게 보냄 (보통 쿠키에 담아줌)
   인증: 이후 사용자가 다른 페이지를 요청할 때마다 이 세션 ID(열쇠)를 같이 보냄.
   확인: 서버는 "오, 이 열쇠 내 메모장에 적힌 거네!" 하고 로그인을 유지시켜줌.

 세션 vs 쿠키?
 - 세션 : 데이터가 서버에 저장됨 -> 사용자는 세션 ID라는 가짜 번호표만 가짐.-> 안전
 - 쿠키 : 데이터가 사용자 브라우저에 저장됨 -> 상대적으로 보안에 취약
                -> 근데 결국 세션도 쿠키를 사용함. 세션ID 전달용으로.

 찾아보니간 그렇다고 세션이 쿠키에 비해 엄청 좋은건 아님.
 1. 서버 부하 : 접속자 100만명이면 서버 메모리 터질 수 있음.
 2. 서버 확장성 : 서버가 2대라면, 1번 서버에서 만든 세션을 2번 서버는 모를 수 있음.
 -> 그래서 요즘에는, 서버 메모리에 저장하지 않고 어디서든 확인 가능한 JWT(Json Web Token) 방식이 많이 쓰임
 -> JWT는 서버에 저장을 안하고 토큰 자체로 정보를 포함하니간 보안에 더 좋을 듯.
 -> 나중에 쇼핑몰 핫딜 프로젝트에서도 트랙픽 몰릴 것을 생각하면, JWT 공부해봐야 할듯???
 */

/* HttpSession이란?
 자바의 서블릿(Servlet)환경에서 세션을 다루기 위해 미리 만들어둔 인터페이스.
 java/spring boot 안에서만 쓰이는 구체적인 기술임.
 개발자가 일일이 세션ID를 생성하고 쿠키를 굽는 복잡한 코드를 짜지 않아도,
 session.setAttributr("loginMember", member)한 줄로 세션을 관리할 수 있게 해주는 편리한 "도구"
 -> 위에서 말한 것과 같이, 서블릿 기반에서 세션을 관리하는 API

           Session (세션)                       HttpSession
정체     추상적인 개념 (Idea)            자바의 인터페이스 (API/Tool)
위치       웹 아키텍처 이론               javax.servlet.http 패키지
사용법   세션 방식으로 로그인 구현       request.getSession()으로 객체 생성
관계         부모/개념                           자식/구현체
 */