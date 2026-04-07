package demo.demo_spring.member.dto;

import lombok.*;

@Getter
@NoArgsConstructor
public class MemberCreateRequest {
    // 회원가입 요청 DTO

    private String loginId;
    private String password;
    private String email;
    private String name;
}