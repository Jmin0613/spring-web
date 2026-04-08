package demo.demo_spring.member.service;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.dto.MemberCreateRequest;
import demo.demo_spring.member.repository.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class MemberService {

    private final MemberRepository memberRepository;

    public MemberService(MemberRepository memberRepository){
        this.memberRepository = memberRepository;
    }

    // 회원가입 + 중복 체크
    public Long create(MemberCreateRequest request) {
        validateDuplicateLoginId(request.getLoginId());

        Member member = Member.createMember(
                request.getLoginId(), request.getPassword(),
                request.getEmail(), request.getName()
        );
        Member savedMember = memberRepository.save(member);
        return member.getId();
    }
    // 아이디 중복 검사
    private void validateDuplicateLoginId(String loginId){
        memberRepository.findByLoginId(loginId)
                .ifPresent(m ->{
                    throw new IllegalStateException("이미 존재하는 아이디입니다.");
                });
    }

    // 로그인
    public Member login(String loginId, String password){
        Member member = memberRepository.findByLoginId(loginId) // loginId로 회원조회
                .orElseThrow(()-> new IllegalStateException("존재하지 않는 아이디입니다."));
        if(!member.getPassword().equals(password)){
            throw new IllegalStateException("비밀번호가 일치하지 않습니다.");
        }
        return member;
    }

    // 회원 단건 조회
    public Member getMember(Long id){
        return memberRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("해당되는 회원이 없습니다."));
    }

    // 회원 전체 조회
    public List<Member> findMembers() {
        return memberRepository.findAll();
    }

}