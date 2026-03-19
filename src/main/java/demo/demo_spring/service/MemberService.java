package demo.demo_spring.service;

import demo.demo_spring.domain.Member;
import demo.demo_spring.repository.MemoryMemberRepository;

import java.util.*;

public class MemberService {
    //service : 기능 제공. repository를 사용. 데이터를 가지고 판단/처리함
    //요구되는 서비스   1.회원가입   2.회원조회

    private final MemoryMemberRepository repository = new MemoryMemberRepository();

    //1. 회원가입 + 중복 체크
    public Long join(Member member) {
        validateDuplicateMember(member);
        repository.save(member);
        return member.getId();
    }
    //중복 검사. 가입 가능 여부 판단이기에 service에 만듦.
    private void validateDuplicateMember(Member member){ //외부에서 쓸 필요x -> private
        repository.findByName(member.getName())
                .ifPresent(m ->{ //ifPresent : 값이 있으면 실행하라 -> m이 있으면(중복) 에러를 터트려라
                    throw new IllegalStateException("이미 존재하는 회원입니다."); //에러 던지기
                });
    }

    //Optional 꺼내서 조회 기능 완성하기
    //2. 회원 조회 - 개인
    public Member findOne(Long id){
        return repository.findById(id).orElse(null);
        //findById(id) 아이디를 조회
        //.orElse(null)값을 꺼냄. 없으면 null.
        //Optional에 올 값이 null인 경우 orElse안에 있는 내용을 실행
    }

    //3. 회원 전체 조회
    public List<Member> findMembers(){
        return repository.findAll();
    }

    //4. 로그인 -> 현재는 일단 name으로만 로그인하게 둠. 나중에 수정할 예정.
    public Member login(String name){ //Member 객체인데, 받아쓰는건 name
        return repository.findByName(name) // 받은 name으로 회원찾기
                .orElse(null); //없으면 null반환
    }

}

    /*3번 회원 전체 조회 -> 왜 Map이 아닌 List로 변환해야 하나?

    현재 Map 구조 :
    "1": { "id": 1, "name": "이주민" },
    "2": { "id": 2, "name": "홍길동" }
    그러나 우리가 원하는 API 응답은 :
    { "id": 1, "name": "이주민" },
    { "id": 2, "name": "홍길동" }
    -> 사용자에게는 List(JSON 배열) 형태가 더 적합하다.
    + 또한 클라이언트/유저 입장에서 id는 이미 Member 안에 있기 때문에 key가 필요가 없음.

    Map → 내부 저장 및 빠른 조회용 (id 기반 접근)
    List → 외부 응답용 (사용자에게 보여주기 쉬운 구조)

    비유:
    Map은 창고 정리 방식.
    List는 손님에게 보여주는 상품 목록 느낌임.
    창고 그대로는 손님한테 안보여주잖아?
     */
