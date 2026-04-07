package demo.demo_spring.member.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) //DB auto increment 방식으로 생성 명시
    private Long id;
    private String loginId;
    private String password;

    private String email;
    private String name;

    @Enumerated(EnumType.STRING)
    private Role role;

    // createMember를 위한 내부 생성자
    private Member(String loginId, String password,
                   String email, String name){
        this.loginId = loginId;
        this.password=password;
        this.email=email;
        this.name=name;
        this.role=Role.USER;
    }

    public static Member createMember(String loginId, String password,
                                      String email, String name){
        return new Member(
                loginId, password, email, name
        );
    }

    //비밀번호 변경
    public void changePassword(String password){this.password=password;}

    //이메일 변경
    public void changeEmail(String email){this.email=email;}

    //관리자 승격
    public void promoteToAdmin(){this.role=Role.ADMIN;}
}