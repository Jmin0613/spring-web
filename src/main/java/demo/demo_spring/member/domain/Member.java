package demo.demo_spring.member.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) //DB auto increment 방식으로 생성 명시
    private Long id;
    private String loginId;
    private String password;

    @Column(unique = true)
    private String email;
    @Column(unique = true)
    private String nickName;

    private String name;

    @CreatedDate
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    private Role role;

    private Member(String loginId, String password,
                   String email, String name, String nickName){
        // 회원가입이기에 모두 체크
        if(loginId == null || loginId.isBlank()){ throw new IllegalStateException("로그인 아이디를 입력해주세요.");}
        if(password == null || password.isBlank()){ throw new IllegalStateException("비밀번호를 입력해주세요.");}
        if(email == null || email.isBlank()){ throw new IllegalStateException("이메일을 입력해주세요.");}
        if(name == null || name.isBlank()){ throw new IllegalStateException("이름을 입력해주세요.");}
        if(nickName == null || nickName.isBlank()){ throw new IllegalStateException("닉네임을 입력해주세요.");}

        this.loginId = loginId; this.password=password;
        this.email=email; this.name=name; this.nickName = nickName;
        this.role=Role.USER;
    }

    // 외부 호출용 회원가입 메서드
    public static Member createMember(String loginId, String password,
                                      String email, String name, String nickName){
        return new Member(
                loginId, password, email, name, nickName
        );
    }

    // 관리자 승격
    public void promoteToAdmin(){this.role=Role.ADMIN;}

    // 마이페이지 내 정보 변경 - nickName, email
    public void updateProfile(String nickName, String email){
        // null, blank 체크 + 값 변경
        if(nickName != null){ // null = 미수정
            if(nickName.isBlank()){ // blank = 잘못된 입력, 예외
                throw new IllegalStateException("닉네임을 공백으로 수정할 수 없습니다.");
            }
            if(!nickName.equals(this.nickName)){ // 회원정보수정은 중요 -> no-op
                this.nickName = nickName;
            }
        }
        if(email != null){
            if(email.isBlank()){
                throw new IllegalStateException("이메일을 공백으로 수정할 수 없습니다.");
            }
            if(!email.equals(this.email)){
                this.email = email;
            }
        }
    }
}