package demo.demo_spring.member.dto;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.domain.Role;
import lombok.*;

@Getter
@NoArgsConstructor
public class MemberCreateRequest {

    private String loginId; //로그인 id
    private String password;//로그인 비밀번호
    private String email; // 이메일
    private String name; //사용자 이름

    //DTOㅂ 기본 생성자
    //스프링이 @RequestBody로 JSON을 객체로 바인딩할 때 기본 생성자가 필요할 수 있음
    // -> 빈 객체 만들고, JSON값 채워넣는 흐름
    //public MemberCreateRequest() {}; -> @NoArgsConstructor사용

    //Member 엔티티로 변환
    public Member toEntity() {
        return new Member(loginId,password,email,name, Role.USER);
    }
}
/*
DTO -> Entity(Member 생성)변환
               -> Service(로직 수행)
               -> Repository (DB 저장)
DTO로 받은 데이터를 Entity로 변환하고,
Service에서 비즈니스 로직을 수행한 뒤 Repository를 통해 DB에 저장.
*/

/*
@NoArgsConstructor : 매개변수가 없는 기본 생성자를 만듦
즉, 프레임워크가 객체를 만들기 위해 필요할 때 많이 사용. -> 빈 객체 생성

@AllArgsConstructor : 모든 필드를 파라미터로 받는 생성자를 만듦. -> 모든 값 채워서 생성
*/
