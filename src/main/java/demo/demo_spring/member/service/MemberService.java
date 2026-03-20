package demo.demo_spring.member.service;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.repository.MemberRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service //이 클래스를 스프링이 관리해라 -> Bean 등록.
// 그전엔 new로 만들어서 필요없엇는데, 지금은 스프링이 만들어주게 바꿔서 필요함 -> 나중에 스프링 DI 더 공부하기
public class MemberService {
    //service : 기능 제공. repository를 사용. 데이터를 가지고 판단/처리함
    //요구되는 서비스   1.회원가입   2.회원조회

    private final MemberRepository repository;

    public MemberService(MemberRepository repository){
        this.repository=repository;
    } //외부에서 주입받은 MemberRepository를 이 클래스에서 사용하기 위해 저장
    // 이게 바로, DI (Dependency Injection)
    // Repository 주세요~ (DI 받는 중)


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

/* DI 구조에 고민을 했음.
그전에는 new로 객체를 직접 만들어주었는데,
이제는 스프링에 관리를 맡기고 그러면서 DI가 생겻기에 new로 안만든다는데... 그냥 new하면 안되나?

근데 안된다고 한다. 가능은 한데, 큰 프로젝트에서는 이렇게 하면 망한다는 것 같다.
new방식으로 하면, 나중에 필요한 객체들 다 new로 코드 넣어주느라 복잡해지는데,
그냥 이렇게 스프링에 관리를 맡겨버리면 자동으로 다 만들어서 넣어줘서 깔금하다는 것 같다.

처음에는 기능 구현과 흐름 이해가 중요해서 new로 직접 객체를 생성했다.
하지만 점점 프로젝트가 커지고 객체가 많아지면서, 객체 생성과 연결을 직접 관리하기 어려워질 것이다.
그래서 스프링 DI를 사용해 객체 생성과 관리를 맡기게 되면, 코드가 깔끔해지고 유지보수가 쉬워진다.
대입을 해보면 음... new MemoryMemberRepository()를 JPA로 바꾸려면 코드를 다 수정해야하지만,
MemberRepository repository는 구현체만 바뀌면되고 코드 수정이 거의 없으니간 편하다는 것 같다.

jpa는 DB를 다루는 기술이고, DI는 객체를 관리하는 구조이기 때문에 서로 다른 개념!!!
또한 DI가 테스트/유지보수에서 핵심인 것 같다. 추가적으로 공부해야겠다.

하나 더 추가!!!! 처음에 그렇다면 "객체 관리를 스프링에 맡기는 코드"는 뭐지??? 하고 고민했는데,
알고보니 @Service, @Controller같은 어노테이션이었다.
핵심은 DI 구조이고, 어노테이션은 스프링에게 알려주는 수단인 것이었다.
MemberService와 MemberController 모두 di를 받는 것일 뿐이엇다.
@Service, @RestController, @Repository 로 나는 스프링에게 관리 역할을 넘긴거였다.

@Service
public class MemberService -> 이 객체는 스프링이 관리해줘~

public MemberController(MemberService memberService) -> 스프링이 만든거 나한테 넣어줘~

 */
