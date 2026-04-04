package demo.demo_spring.notice.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Notice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String content; // 나중에 길어질 수 있으니, text계열 고려하기

    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;

    //createNotice를 위한 내부 생성자
    private Notice (String title, String content){
        this.title = title; this.content = content;
    }

    // Notice 등록/생성 메서드
    public static Notice createNotice(String title, String content){
        if(title == null || title.isBlank()){
            throw new IllegalStateException("공지 제목이 비어있습니다.");
        }
        if(content == null || content.isBlank()){
            throw new IllegalStateException("공지 내용이 비어있습니다.");
        }
        return new Notice(title, content);
    }

    // Notice 수정 메서드
    public void updateNoice(String title, String content){
        if (title!=null && !title.isBlank()) this.title = title;
        if (content!=null && !content.isBlank()) this.content = content;
    }
}
