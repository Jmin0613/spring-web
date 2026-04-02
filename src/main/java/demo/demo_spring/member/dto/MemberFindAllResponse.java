package demo.demo_spring.member.dto;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.domain.Role;
import lombok.Getter;
import lombok.AllArgsConstructor;

@Getter
@AllArgsConstructor
public class MemberFindAllResponse {
    // 관리자용 회원 전체 조회 응답 DTO

    private Long id;
    private String loginId;
    private String email;
    private String name;
    private Role role;

    //생성자 -> @AllArgsConstructor
    //엔티티 -> DTO
    public static MemberFindAllResponse fromEntity(Member member){
        return new MemberFindAllResponse(member.getId(), member.getLoginId(),
                member.getEmail(), member.getName(), member.getRole());
    }
    // -------------------------> 이것도 리팩토링 해주기
}