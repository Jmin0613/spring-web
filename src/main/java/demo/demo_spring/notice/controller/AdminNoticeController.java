package demo.demo_spring.notice.controller;

import demo.demo_spring.notice.dto.NoticeCreateRequest;
import demo.demo_spring.notice.dto.NoticeDetailResponse;
import demo.demo_spring.notice.dto.NoticeListResponse;
import demo.demo_spring.notice.dto.NoticeUpdateRequest;
import demo.demo_spring.notice.service.NoticeService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class AdminNoticeController {
    private final NoticeService noticeService;
    public AdminNoticeController(NoticeService noticeService){
        this.noticeService = noticeService;
    }

    // 등록
    @PostMapping("/admin/notice")
    public Long create(@RequestBody @Valid NoticeCreateRequest request){
        return noticeService.createNotice(request);
    }

    // 수정
    @PatchMapping("/admin/notices/{noticeId}")
    public void update(@PathVariable Long noticeId, @RequestBody NoticeUpdateRequest request){
        noticeService.updateNotice(noticeId, request);
    }

    // 삭제
    @DeleteMapping("/admin/notices/{noticeId}")
    public void delete(@PathVariable Long noticeId){noticeService.deleteNotice(noticeId);}

    // 목록
    @GetMapping("/admin/notices")
    public List<NoticeListResponse> findAllNotice(){return noticeService.findAllNotice();}

    // 글보기 -> 상세보기
    @GetMapping("/admin/notices/{noticeId}")
    public NoticeDetailResponse findNotice(@PathVariable Long noticeId){
        return noticeService.findNotice(noticeId);
    }

}
