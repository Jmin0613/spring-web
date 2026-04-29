package demo.demo_spring.notice.repository;

import demo.demo_spring.notice.domain.Notice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
    // 공지 목록 최신순 조회
    List<Notice> findAllByOrderByCreatedAtDesc();
}
