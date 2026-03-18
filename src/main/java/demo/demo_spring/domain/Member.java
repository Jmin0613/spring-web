package demo.demo_spring.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

@Entity //이 클래스를 db에 저장한다고 알림
public class Member {

    // 요구사항 : 회원id, 이름
    @Id //DB의 기본키(PK)를 매칭해주는 어노테이션
    @GeneratedValue //db가 알아서 값을 자동 증가시킴 -> 기본키 생성을 DB에 위임
    private Long id;
    private String name;

    //getter setter
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setNaame(String name) {
        this.name = name;
    }
}