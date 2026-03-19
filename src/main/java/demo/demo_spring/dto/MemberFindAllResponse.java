package demo.demo_spring.dto;

import demo.demo_spring.domain.Member;

public class MemberFindAllResponse {
    private Long id;
    private String name;

    public MemberFindAllResponse(Member member){
        this.id = member.getId();
        this.name = member.getName();
    }

    public static MemberFindAllResponse fromEntity(Member member){
        return new MemberFindAllResponse(member);
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
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
