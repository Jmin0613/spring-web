package demo.demo_spring.member.repository;

import demo.demo_spring.member.domain.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByLoginId(String loginId);

    // loginId 중복 체크
    boolean existsByLoginId(String loginId);

    // email 중복 체크
    boolean existsByEmail(String email);

    // nickName 중복 체크
    boolean existsByNickName(String nickName);
}