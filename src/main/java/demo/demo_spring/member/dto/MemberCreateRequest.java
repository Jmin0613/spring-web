package demo.demo_spring.member.dto;

import demo.demo_spring.global.validatationPatterns.PasswordValidator;
import demo.demo_spring.global.validatationPatterns.PhoneNumberValidator;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@NoArgsConstructor
public class MemberCreateRequest {
    // 회원가입 요청 DTO

    @NotBlank(message = "로그인 아이디를 입력해주세요.")
    private String loginId;

    @NotBlank(message = "비밀번호를 입력해주세요.")
    @Pattern(
            regexp = PasswordValidator.PASSWORD,
            message = "비밀번호는 12자 이상이며, 대문자 1개 이상, 소문자 1개 이상, 숫자 1개 이상, 특수문자 1개 이상을 포함해야 합니다."
    )
    private String password;

    @NotBlank(message = "이메일을 입력해주세요.")
    @Email(message = "올바른 이메일 형식이어야 합니다.")
    private String email;

    @NotBlank(message = "이름을 입력해주세요.")
    private String name;
    @NotBlank(message = "닉네임을 입력해주세요.")
    private String nickName;

    @NotBlank(message = "전화번호를 입력해주세요.")
    @Pattern(
            regexp = PhoneNumberValidator.PHONE_NUMBER,
            message = "전화번호 형식이 올바르지 않습니다."
    )
    private String phoneNumber;
}