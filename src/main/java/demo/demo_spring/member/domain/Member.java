package demo.demo_spring.member.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor
public class Member {

    @Id
    @GeneratedValue
    private Long id;
    private String loginId;
    private String password;
    private String email;
    private String name;

    @Enumerated(EnumType.STRING)
    private Role role;

    // 멤버 생성 엔티티메서드로 리팩토링 해주기
    public Member(String loginId, String password, String email,
                  String name, Role role){
        this.loginId = loginId;
        this.password=password;
        this.email=email;
        this.name=name;
        this.role=role;
    }

    //비밀번호 변경
    public void changePassword(String password){this.password=password;}

    //이메일 변경
    public void changeEmail(String email){this.email=email;}

    //관리자 승격
    public void promoteToAdmin(){this.role=Role.ADMIN;}
}