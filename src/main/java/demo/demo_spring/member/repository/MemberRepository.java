package demo.demo_spring.member.repository;

import demo.demo_spring.member.domain.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

//@Repository //DB 예외를 스프링 예외로 변환해주기
// -> JpaRepository를 상속하면 보통 스프링이 자동으로 Bean 등록해줌
public interface MemberRepository extends JpaRepository<Member, Long> {
    //extends JpaRepository<Member, Long> -> Member 테이블 사용, 기본키 타입 -> Long

    Optional<Member> findByName(String name); //나중에 연결 다 끊고 지워주기

    Optional<Member> findByLoginId(String loginId); //loginId로 회원 조회
}