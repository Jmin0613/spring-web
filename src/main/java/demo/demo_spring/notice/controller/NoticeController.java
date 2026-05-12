package demo.demo_spring.notice.controller;

import demo.demo_spring.notice.dto.NoticeDetailResponse;
import demo.demo_spring.notice.dto.NoticeListResponse;
import demo.demo_spring.notice.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class NoticeController {
    private final NoticeService noticeService;

    // 목록
    @GetMapping("/notices")
    public List<NoticeListResponse> findAllNotice(){return noticeService.findAllNotice();}

    // 글보기 -> 상세보기
    @GetMapping("/notices/{noticeId}")
    public NoticeDetailResponse findNotice(@PathVariable Long noticeId){
        return noticeService.findNotice(noticeId);
    }

}
