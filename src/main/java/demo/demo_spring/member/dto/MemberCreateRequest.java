package demo.demo_spring.member.dto;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.domain.Role;
import lombok.*;

@Getter
@NoArgsConstructor
public class MemberCreateRequest {
    // 회원가입 요청 DTO

    private String loginId;
    private String password;
    private String email;
    private String name;

    //Member 엔티티로 변환
    public Member toEntity() {
        return new Member(loginId,password,email,name, Role.USER);
    }
}