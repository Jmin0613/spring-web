package demo.demo_spring.mypage.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MemberEditMyInfoRequest {
    private String nickName;
    private String email;
    private String phoneNumber;

    private String currentPassword;
    private String newPassword;
    private String newPasswordConfirm;
}
