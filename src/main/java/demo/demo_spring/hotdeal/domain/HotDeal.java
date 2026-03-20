package demo.demo_spring.hotdeal.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

import java.time.LocalDateTime;

@Entity // db테이블과 연결된 객체라고 선언! db랑 매핑되는 객체.
public class HotDeal {

    @Id //DB의 기본키(PK)를 매칭해주는 어노테이션
    @GeneratedValue //db가 알아서 값을 자동 증가시킴 -> 기본키 생성을 DB에 위임
    private Long id; //상품 번호, 상품id, 품번
    // private String name; //상품 이름 -> 아직 상품 테이블 안만들어서 주석처리하고 진행해봄

    private String title; //핫딜 게시글 제목
    private int price; //원가격
    private int discountPrice; //할인가격
    private int quantity; //재고 수량

    private LocalDateTime startTime; //핫딜 시작 시간
    private LocalDateTime endTime; //핫딜 종료 시간

    //기본 생성자. 외부에서 마음대로 생성못하고 jpa만 쓰게 protected로 설정해주기.
    public HotDeal(){};

    //생성자 getter setter
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public int getPrice() {
        return price;
    }

    public void setPrice(int price) {
        this.price = price;
    }

    public int getDiscountPrice() {
        return discountPrice;
    }

    public void setDiscountPrice(int discountPrice) {
        this.discountPrice = discountPrice;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
}
