package demo.demo_spring.member.dto;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.domain.Role;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MemberFindAllResponse {
    // 관리자용 회원 전체 조회 응답 DTO

    private Long id;
    private String loginId;
    private String email;
    private String name;
    private Role role;

    // -> fromEntity()가 내부에서 호출할 생성자
    public MemberFindAllResponse(Member member){
        this.id = member.getId(); this.loginId = getLoginId();
        this.email = member.getEmail(); this.name = member.getName(); this.role = member.getRole();
    }

    //엔티티 -> DTO
    public static MemberFindAllResponse fromEntity(Member member){
        return new MemberFindAllResponse(member);
    }

}