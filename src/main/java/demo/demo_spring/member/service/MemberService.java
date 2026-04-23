package demo.demo_spring.member.service;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.dto.LoginIdCheckResponse;
import demo.demo_spring.member.dto.MemberCreateRequest;
import demo.demo_spring.member.dto.MemberFindResponse;
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
        // loginId, email, nickName, phoneNumber 중복 체크
        validateDuplicateLoginId(request.getLoginId());
        validateDuplicateEmail(request.getEmail());
        validateDuplicateNickName(request.getNickName());
        validateDuplicatePhoneNumber(request.getPhoneNumber());

        Member member = Member.createMember(
                request.getLoginId(), request.getPassword(),
                request.getEmail(), request.getName(), request.getNickName(), request.getPhoneNumber()
        );
        memberRepository.save(member);
        return member.getId();
    }
    // 아이디 중복 검사
    private void validateDuplicateLoginId(String loginId){
        if(memberRepository.existsByLoginId(loginId)){
            throw new IllegalStateException("이미 존재하는 아이디입니다.");
        }
    }
    // 이메일 중복 검사
    private void validateDuplicateEmail(String email){
        if(memberRepository.existsByEmail(email)){
            throw new IllegalStateException("이미 존재하는 이메일입니다.");
        }
    }
    // 닉네임 중복 검사
    private void validateDuplicateNickName(String nickName){
        if(memberRepository.existsByNickName(nickName)){
            throw new IllegalStateException("이미 존재하는 닉네임입니다.");
        }
    }
    // 핸드폰 번호 중복 검사
    private void validateDuplicatePhoneNumber(String phoneNumber){
        if(memberRepository.existsByPhoneNumber(phoneNumber)){
            throw new IllegalStateException("이미 가입된 전화번호입니다.");
        }
    }

    // 회원가입 시, 로그인id 중복 확인용
    // validateDuplicateLoginId같은 저장용이 아닌, 프론트에서 중복확인 버튼 눌렀을 때 미리 알려주는 용도.
    public LoginIdCheckResponse checkLoginId(String loginId){
        if(loginId == null || loginId.isBlank()){
            throw new IllegalStateException("로그인 아이디를 입력해주세요.");
        }

        if(memberRepository.existsByLoginId(loginId)){
            return LoginIdCheckResponse.unavailable();
        }

        return LoginIdCheckResponse.available();
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
    public MemberFindResponse adminFindMember(Long id){
        Member member  = memberRepository.findById(id)
                .orElseThrow(()-> new IllegalStateException("해당하는 회원이 없습니다."));
        return MemberFindResponse.fromEntity(member);
    }

    // 관리자용 회원 전체 조회
    public List<MemberFindResponse> adminFindAllMembers() {
        return memberRepository.findAll()
                .stream()
                .map(MemberFindResponse::fromEntity)
                .toList();
    }

    // 내부 공통 메서드
    public Member getMember(Long id){
        return memberRepository.findById(id)
                .orElseThrow(()-> new IllegalStateException("해당하는 회원이 없습니다."));
    }

}