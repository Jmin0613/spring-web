package demo.demo_spring.repository;

import demo.demo_spring.domain.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository //DB 예외를 스프링 예외로 변환해주기
public interface MemberRepository extends JpaRepository<Member, Long> {
    //extends JpaRepository<Member, Long> -> Member 테이블 사용
    //기본키 타입 -> Long

    // 더이상 Map으로 가짜 db만들어 사용하는 MemoryMemberRepository가 아닌,
    // JPA연동하여 MemberRepository 사용

    Optional<Member> findByName(String name); // 이거 메서드 맞음. 내용body만 없는거임.
    //name으로 Member를 찾는데, 있을수도 없을수도?
    //SELECT * FROM member WHERE name = ?

    /*
    save, findByid, findAll까지 다시 만드는건가 했는데,
    JpaRepository에 이미 들어가 있는 메서드들이라
    어차피 제공되어서 안만들어도 된단다.
    이 외에도 delete()까지는 "모든 Entiry에 공통으로 필요한 기능"이라서 제공된단다.
    findByName이 왜 없을까했는데, name이라는 필드는 Entiry마다 다르기 때문이란다.
    어디서는 name, 어디서는 price, 어디서는 orderDate등등..
    그래서 JPA는 "어떤 필드로 조회할지 모르니깐 안 만듦"
    고로 나는 name을 기준으로 조회하기 위해 따로 만들어준거임.
     */

}
/* @Repository
나는 이게 단순히 @Service와 비슷하게, 스프링에게 이게 Repository라고 알려주는 용도인지 알았음. 근데 아녔음.
핵심은 "DB 예외를 스프링 예외로 변환"하는거였음.

DB에서 에러가 나면 SQLException(db에러)같이 나오는데, db마다 좀 다름.
스프링이 이걸 DataAccessException(통일된 에러)로 바꿔주는 거였음.

쉽게 말하면 개발자는 db종류에 상관없이 동일한 방식으로 예외를 처리할 수 있고, 코드의 복잡도를 줄일 수 있음.

그래서 @Repository의 역할은 크게
1. Bean 등록 -> 스프링이 관리
2. DB 에러 -> 스프링 에러 변환
이 두가지임.

아 그리고 @Service와 @Repository의 차이에 대해 조금 더 찾아보았는데,
- @Service: 비즈니스 로직 처리
- @Repository: DB 접근 + 예외 변환
당연하긴 하지만... 공부하면서 같은 어노테이션이라 혼동할 뻔했으니간. 정리하면 좋을것같아서!

   +@) public interface MemberRepository extends JpaRepository을 쓰면 @Repository없어도 된다!
    jpa가 내부적으로 @Repository를 포함하고 있어서 자동으로 처리해 준다!
    그래도 이걸 몰랐기에 더 찾아보고 배운것같다.
 */
