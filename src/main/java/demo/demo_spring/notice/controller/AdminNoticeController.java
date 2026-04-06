package demo.demo_spring.notice.controller;

import demo.demo_spring.notice.dto.AdminNoticeCreateRequest;
import demo.demo_spring.notice.dto.NoticeDetailResponse;
import demo.demo_spring.notice.dto.NoticeListResponse;
import demo.demo_spring.notice.dto.AdminNoticeUpdateRequest;
import demo.demo_spring.notice.service.NoticeService;
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
    public Long create(@RequestBody AdminNoticeCreateRequest request){
        return noticeService.createNotice(request);
    }

    // 수정
    @PatchMapping("/admin/notice/{id}")
    public void update(@PathVariable Long id, @RequestBody AdminNoticeUpdateRequest request){
        noticeService.updateNotice(id, request);
    }

    // 삭제
    @DeleteMapping("/admin/notice/{id}")
    public void delete(@PathVariable Long id){noticeService.deleteNotice(id);}

    // 목록
    @GetMapping("/admin/notice")
    public List<NoticeListResponse> findAllNotice(){return noticeService.findAllNotice();}

    // 글보기 -> 상세보기
    @GetMapping("/admin/notice/{id}")
    public NoticeDetailResponse findNotice(@PathVariable Long id){
        return noticeService.findNotice(id);
    }

}
