package demo.demo_spring.member.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor //DTO도 @RequestBody로 받을걸라서 스프링이 JSON->객체 변환시 필요할 수 있음
public class MemberLoginRequest { // ----> 로그인 입력값 전달용 DTO
    // 관리자/회원 공통 로그인 요청 DTO

    //로그인 기준 : loginId+password
    private String loginId;
    private String password;

    /*
    기본 생성자 주입 -> @NoArgsConstructor
    getter -> @Getter

    setter가 없는 이유 : 리플렉션(reflection)
    자바 코드에선 private이라 직접 접근 못하지만,
    프레임워크는 내부 기술을 써서 값을 읽고 넣을 수 있음
    그래서 setter가 없어도 동작함.

    그렇다면 setter를 쓰는 이유는?
    1. 단순하게 값 넣기 편해서
    2. 바인딩이 직관적이어서

    앞으로 setter는
    엔티티의 경우, 사용을 최소화. -> 기본 생성자 + 의미있는 메서드
    DTO의 경우, 필수x. 필요한 경우에만 -> 스프링/jackson이 기본 생성자 + 리플렉션으로 채움

    setter는 값을 넣는 여러 방법 중 하나일 뿐이고,
    스프링의 Request DTO는 기본생성자와 리플렉션으로도 값이 들어갈 수 있음. setter필수 아님!!!!!!!!
    */

    /*MemberCreateRequest처럼 toEntity() 필요x
    새 회원 생성x -> 기존 회원 조회+비밀번호 검증
    그냥 로그인 입력값 전달용 DTO

    Entity(Member)는 소중한 원본 데이터니까 컨트롤러까지 끌고 나오지 말고,
    입구(Controller)에서는 전용 배달원(DTO)을 써라!
    */
}