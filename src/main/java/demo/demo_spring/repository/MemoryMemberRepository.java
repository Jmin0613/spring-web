package demo.demo_spring.repository;

import demo.demo_spring.domain.Member;

import java.util.*;

public class MemoryMemberRepository {
    //repository : 데이터 저장, 조회.  로직 거의x. 그냥 넣고 꺼냄.

    //DB를 대신할 가짜DB 생성
    private static Map<Long, Member> store = new HashMap<>();
    private static long sequence = 0L;

    //회원가입
    public Member save(Member member){
        member.setId(++sequence); //시스템이 부여하는 id. id 넣어줌.
        store.put(member.getId(), member); //회원정보를 가짜db인 store에 저장
        return member; //생성한 회원(Member)를 반환
    }
    //중복 체크
    public Optional<Member> findByName(String name){
        return store.values().stream()
                //store.values -> Map에 있는 모든 회원을 꺼냄. steam -> 그걸 순차적으로 검사
                .filter(member ->member.getName().equals(name))
                //filter()->조건에 맞는 회원만 남김
                .findAny();
                //findAny() 조건에 맞는 회원 하나 찾으면 반환. 없으면 Optional 반환
    }
    /* 람다식 풀이 : member -> member.getName().equals(name)
        (Member member) {
        return member.getName().equals(name);
        }
     */

    //id로 회원찾기
    public Optional<Member> findById(long id){
        //Optional 이라는 객체안데 Member를 담는다. 값의 상태까지 포함하는 객체.
        //감싸지 않으면 값이 없을 때 null을 반환하는데
        //null을 그대로 쓰면 NullPointerException 위험
        //Optional을 쓰면 -> 있을 수도~ 없을 수도~ -> 더 안전

        return Optional.ofNullable(store.get(id));
        //값 o -> Optional 안에 넣음
        //값 x -> 비어있는 Optional 생성
    }

    //회원 전체 조회
    public List<Member> findAll(){
        return new ArrayList<>(store.values());
        //store.values() : Ma안에 저장된 모든 Member 객체를 반환
        //  ex)  [Member(1, "이주민"), Member(2, "홍길동")]

        // new ArrayList<>(...) : List형태로 변환
        // -> Controller에서 사용하기 쉽게 List 형태로 반환한거임

        // 저장된 모든 회원을 리스트로 돌려줌
    }
}
//Map -> values -> List 변환

/* store자체는 Map인데, 그럼 우선 store를 List로 변환한 다음 .values()를 해야하지 않나?
 X -> store.values() 자체가 List

 ex) Map
 key → value
1   → Member(1, "이주민")
2   → Member(2, "홍길동")

store.keySet()   -> key만 꺼냄
store.values()   -> value만 꺼냄
store.entrySet() -> key+value 같이

store.values()의 반환 타입 -> Collection<Member>
쉽게 말해서, Map에서 값만 쭉 꺼내어 리스트에 담은 것.
*/