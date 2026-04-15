package demo.demo_spring.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@NoArgsConstructor
public class MemberCreateRequest {
    // 회원가입 요청 DTO

    @NotBlank(message = "로그인 아이디를 입력해주세요.")
    private String loginId;
    @NotBlank(message = "비밀번호를 입력해주세요.")
    private String password;

    // @Email() 나중에 형식 추가하기
    @NotBlank(message = "이메일을 입력해주세요.")
    private String email;

    @NotBlank(message = "이름을 입력해주세요.")
    private String name;
    @NotBlank(message = "닉네임을 입력해주세요.")
    private String nickName;
}