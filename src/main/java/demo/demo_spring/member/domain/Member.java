package demo.demo_spring.member.domain;

import jakarta.persistence.*;
import lombok.Getter;

@Getter //setter X. getter만 두고 엔티티 변경 제한하자.
@Entity //이 클래스를 db에 저장한다고 알림
public class Member { //-------> DB 저장용 객체

    @Id //DB의 기본키(PK)를 매칭해주는 어노테이션
    @GeneratedValue //db가 알아서 값을 자동 증가시킴 -> 기본키 생성을 DB에 위임
    private Long id; //db 기본키
    private String loginId; //로그인 id
    private String password;//로그인 비밀번호
    private String email; // 이메일
    private String name; //사용자 이름

    @Enumerated(EnumType.STRING)
    private Role role; // 역할

    //기본 생성자 선언
    protected Member(){}

    public Member(String loginId, String password, String email,
                  String name, Role role){
        this.loginId = loginId;
        this.password=password;
        this.email=email;
        this.name=name;
        this.role=role;
    }

    /* setter는 두지 말자. 이건 변하면 안되는 회원 정보니까.
    setter 열어두면 아무 곳에서나 값을 바꿀 수 잇음. 그러면 객체가 너무 쉽게 변함.

    처음에 public말고 protected같은걸로 하면 괜찮지 않을가햇는데...
    결국 같은 패키지면 서비스나 다른 클래스가 바꿔버릴수있으니간.

    그러니간 처음 생성할떄 생성자로 값을 넣고, 나중에 수정이 필요할떄 메서드를 추가하자.
    애초에 Entity에 setter는 안쓰거나 최소화하는게 좋을 거 같음.
    DTO에서나 요청값 받아오는 용도로 쓰자.
    */

    //비밀번호 변경
    public void changePassword(String password){this.password=password;}

    //이메일 변경
    public void changeEmail(String email){this.email=email;}

    //역할 변경 (일반 -> 관리자)
    //기본으로 USER를 넣어줄거라, 관리자 승격은 이 메서드로 이후 진행.
    public void promoteToAdmin(){this.role=Role.ADMIN;}
}