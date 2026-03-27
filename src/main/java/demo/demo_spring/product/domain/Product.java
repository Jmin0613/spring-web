package demo.demo_spring.product.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity //db테이블과 1:1로 대응되는 핵심 객체
@NoArgsConstructor(access = AccessLevel.PROTECTED)
// @NoArgsConstructor -> 매개변수 없는 생성자 자동 생성
// access = ... -> 그 생성자의 접근제어자
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) //DB auto increment 방식으로 생성 명시
    private Long id; //PK
    private String name;

    private String description;
    private String imageUrl;

    private int price;
    private int stock;
    private String category;

    private LocalDateTime createdAt; //이 두가지, 일단 필드에는 두고
    private LocalDateTime updatedAt; // 서비스에서 넣어도될듯.

    @Enumerated(EnumType.STRING)
    private ProductStatus status;

    //id빼고
    public Product (String name, String description, String imageUrl,
                    int price, int stock, String category,
                    LocalDateTime createdAt, LocalDateTime updatedAt,
                    ProductStatus status){
        this.name = name; this.description = description; this.imageUrl = imageUrl;
        this.price = price; this.stock = stock; this.category = category;
        this.createdAt = createdAt; this.updatedAt = updatedAt; this.status = status;
    }
}
/* @GeneratedValue strategy
1. IDENTITY : DB가 auto increment로 관리
2. SEQUENCE : DB의 시퀀스 객체를 써서 번호를 뽑아오는 방식 (번호 뽑는 기계)
3. TABLE : 번호 생성용 테이블을 따로 만들어 관리하는 방식
4. AUTO : DB종류에 따라 JPA가 알아서 골라줌 (MySQL이면 이거, Oracle이면 저거)
 */

/* @AllArgsConstructor 조심해야하는 이유
@AllArgsConstructor는 모든 필드를 파라미터로 받는 생성자를 만듥.
그래서 id, createdAt, updatedAt, status처럼, 생성 시점에 꼭 외부에서 받지 않아도 되는 값까지 전부 받게 됨.
그 결과 엔티티를 만들때 오히려 불편하고 실수하기 쉬워짐.
-> 생성에 꼭 필요하지 않은 값까지 전주 강제로 넣게 되는 것
그래서 엔티티는 보통 @AllArgsConstructor보다 직접 필요한 값만 받는 생성자를 많이 씀.
 */