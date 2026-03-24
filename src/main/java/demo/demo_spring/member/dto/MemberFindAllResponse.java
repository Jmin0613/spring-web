package demo.demo_spring.member.dto;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.domain.Role;
import lombok.Getter;
import lombok.AllArgsConstructor;

@Getter
@AllArgsConstructor
public class MemberFindAllResponse {
    // 관리자용 회원 전체 조회 응답 DTO

    private Long id;
    private String loginId;
    private String email;
    private String name;
    private Role role;

    //생성자 -> @AllArgsConstructor

    //DTO로 변환해서 보내주기
    public static MemberFindAllResponse fromEntity(Member member){
        return new MemberFindAllResponse(member.getId(), member.getLoginId(),
                member.getEmail(), member.getName(), member.getRole());
    }

    // setter 필요없음
}
/*
요청 Request DTO는 setter가 필요한데,
응답 Response DTO는 setter가 필요없음.

요청DTO는 클라이언트 -> 서버로 들어오는 데이터인데,
스프링이 값을 넣어주면서 내부적으로 동작함.
그래서 값을 채워야 하기에 getter setter 둘다 필요.

그런데 응답 DTO는 서버 -> 클라이언트로 보내는 데이터임.
우리가 직접 생성자에 값을 넣어줌.
이미 완성된 데이터를 보내니까 굳이 setter가 필요 없는거임.

Spring이 getter로 값을 꺼내서 응답으로 보내준다
Spring이 클라이언트 데이터를 setter로 채워준다
핵심은 getter/setter를 누가 호출하냐

1. 클라이언트가 서버에게 요청을 보낸다
2. 요청에 데이터가 있으면, Spring이 setter를 통해 DTO에 값을 넣는다
3. 서버는 그 데이터를 이용해 DB에 저장하거나 처리한다
4. 조회할 때는 DB에서 데이터를 꺼낸다
5. 그 데이터를 이용해 새로운 Response DTO 객체를 생성자로 만든다
6. Spring이 getter를 사용해서 값을 꺼내 JSON으로 변환하여 클라이언트에게 응답한다

 */
