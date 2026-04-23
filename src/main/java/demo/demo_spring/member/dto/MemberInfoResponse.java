package demo.demo_spring.member.dto;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.domain.Role;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MemberInfoResponse {
    // 회원 본인 내 정보 조회 응답 DTO

    private Long id;
    private String loginId;
    private String email;
    private String name;
    private String nickName;
    private Role role;

    // fromEntity가 내부에서 호출할 생성자
    public MemberInfoResponse(Member member){
        this.id = member.getId(); this.loginId = member.getLoginId();
        this.email = member.getEmail(); this.name = member.getName(); this.role = getRole();
        this.nickName = member.getNickName();
    }

    // 엔티티 -> DTO
    public static MemberInfoResponse fromEntity(Member member){
        return new MemberInfoResponse(member);
    }

}
