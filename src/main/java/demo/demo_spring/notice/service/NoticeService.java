package demo.demo_spring.notice.service;

import demo.demo_spring.notice.domain.Notice;
import demo.demo_spring.notice.dto.NoticeCreateRequest;
import demo.demo_spring.notice.dto.NoticeDetailResponse;
import demo.demo_spring.notice.dto.NoticeListResponse;
import demo.demo_spring.notice.dto.NoticeUpdateRequest;
import demo.demo_spring.notice.repository.NoticeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NoticeService {
    //repository 주입 + DI
    private final NoticeRepository noticeRepository;
    public NoticeService(NoticeRepository noticeRepository){
        this.noticeRepository = noticeRepository;
    }

    // 공지글 등록
    public Long createNotice(NoticeCreateRequest request){
        Notice notice = Notice.createNotice(request.getTitle(), request.getContent());
        return notice.getId();
    }

    // 공지글 수정
    public void updateNotice(Long id, NoticeUpdateRequest request){
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(()->new IllegalStateException("해당하는 공지글이 없습니다."));
        notice.updateNoice(request.getTitle(), request.getContent());
    }

    // 공지글 삭제
    public void deleteNotice(Long id){
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(()->new IllegalStateException("해당하는 공지글이 없습니다."));
        noticeRepository.delete(notice);
    }

    // 공지 목록 조회
    public List<NoticeListResponse> findAllNotice(){
        return noticeRepository.findAll()
                .stream().map(NoticeListResponse::fromEntity)
                .toList();
    }

    // 공지글 보기 -> 상세보기
    public NoticeDetailResponse readNotice(Long id){
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(()->new IllegalStateException("해당하는 공지글이 없습니다."));
        return NoticeDetailResponse.fromEntity(notice);
    }
}
