package demo.demo_spring.member.dto;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.domain.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MemberInfoResponse {
    // 회원 본인 내 정보 조회 응답 DTO

    private Long id;
    private String loginId;
    private String email;
    private String name;
    private Role role;

    //생성자 -> @AllArgsConstructor

    //DTO로 변환해서 보내주기
    public static MemberInfoResponse fromEntity(Member member){
        return new MemberInfoResponse(member.getId(), member.getLoginId(),
                member.getEmail(), member.getName(), member.getRole());
    }

    // setter 필요없음
}
