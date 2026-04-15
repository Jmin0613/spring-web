package demo.demo_spring.member.repository;

import demo.demo_spring.member.domain.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByLoginId(String loginId); //loginId로 회원 조회

    // email 중복 체크
    boolean existsByEmail(String email);

    // nickName 중복 체크
    boolean existsByNickName(String nickName);
}