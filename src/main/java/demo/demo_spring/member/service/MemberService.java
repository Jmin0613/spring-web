package demo.demo_spring.member.service;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.repository.MemberRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MemberService {

    private final MemberRepository repository;

    public MemberService(MemberRepository repository){
        this.repository=repository;
    }

    // 회원가입 + 중복 체크
    public Long join(Member member) {
        validateDuplicateMember(member);
        repository.save(member);
        return member.getId(); //기본키 반환
    }
    // 중복 검사 -> 가입 가능 여부 판단이기에 service에 만듦.
    private void validateDuplicateMember(Member member){
        repository.findByLoginId(member.getLoginId())
                .ifPresent(m ->{
                    throw new IllegalStateException("이미 존재하는 회원입니다.");
                });
    }
    //------------------> 이것도 생성규칙 모으듯, 엔티티메서드로 리팩토링하기. 아, 중복검사는 남기기. 이건 객체생성아님.

    // 로그인
    public Member login(String loginId, String password){
        Member member = repository.findByLoginId(loginId) // loginId로 회원조회
                .orElseThrow(()-> new IllegalStateException("존재하지 않는 아이디입니다."));
        if(!member.getPassword().equals(password)){
            throw new IllegalStateException("비밀번호가 일치하지 않습니다.");
        }
        return member;
    }

    // 회원 단건 조회
    public Member findOne(Long id){
        return repository.findById(id)
                .orElseThrow(() -> new IllegalStateException("해당되는 회원이 없습니다."));
    }

    // 회원 전체 조회
    public List<Member> findMembers() {
        return repository.findAll();
    }

}