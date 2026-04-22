package demo.demo_spring.member.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MemberLoginRequest {
    // 관리자/회원 공통 로그인 요청 DTO

    //로그인 기준
    @NotBlank
    private String loginId;
    @NotBlank
    private String password;
}