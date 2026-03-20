package demo.demo_spring.hotdeal.repository;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.member.domain.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// @Repository -> JpaRepository쓰면 자동으로 처리되서 안붙여도 되긴함.
public interface HotDealRepository extends JpaRepository<HotDeal, Long> {
    //사용 테이블 -> HotDeal / 기본키 타입 -> Long

}
