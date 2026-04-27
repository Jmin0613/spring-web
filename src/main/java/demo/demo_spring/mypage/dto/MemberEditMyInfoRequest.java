package demo.demo_spring.mypage.dto;

import demo.demo_spring.global.validatationPatterns.PasswordValidator;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MemberEditMyInfoRequest {
    private String nickName;
    private String email;
    private String phoneNumber;

    private String currentPassword;
//    @Pattern(
//            regexp = PasswordValidator.PASSWORD,
//            message = "새 비밀번호는 12자 이상이며, 대문자 1개 이상, 소문자 1개 이상, 숫자 1개 이상, 특수문자 1개 이상을 포함해야 합니다."
//    ) -> 서비스에서 체크해주기.
    private String newPassword;
    private String newPasswordConfirm;
}
