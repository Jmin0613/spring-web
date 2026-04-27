package demo.demo_spring.mypage.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MemberPasswordCheckRequest {
    //비밀번호 인증

    @NotBlank(message = "비밀번호를 입력해주세요.")
    private String currentPassword;
}
