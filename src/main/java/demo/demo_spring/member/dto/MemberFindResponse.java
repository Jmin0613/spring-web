package demo.demo_spring.member.dto;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.domain.Role;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MemberFindResponse {
    // 관리자용 회원 조회 응답 DTO

    private Long id;
    private String loginId;
    private String email;
    private String name;
    private Role role;

    public MemberFindResponse(Member member){
        this.id = member.getId(); this.loginId = member.getLoginId();
        this.email = member.getEmail(); this.name = member.getName(); this.role = member.getRole();
    }

    //엔티티 -> DTO
    public static MemberFindResponse fromEntity(Member member){
        return new MemberFindResponse(member);
    }

}