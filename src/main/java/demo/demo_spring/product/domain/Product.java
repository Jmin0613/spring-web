package demo.demo_spring.product.domain;

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

    // 시간 자동 입력 및 갱신
    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    private ProductStatus status;

    //createProduct를 위한 내부 생성자
    private Product (String name, String description, String imageUrl,
                    int price, int stock, String category, ProductStatus status){
        this.name = name; this.description = description; this.imageUrl = imageUrl;
        this.price = price; this.stock = stock; this.category = category; this.status = status;
    }

    // 상품 등록/생성 메서드 -> 값들 받아와서 조립
    public static Product createProduct(String name, String description, String imageUrl,
                                        int price, int stock, String category, ProductStatus status){

        if (price <=0){
            throw new IllegalStateException("잘못된 가격을 입력하셨습니다.");
        }
        if (stock <=0){
            throw new IllegalStateException("잘못된 수량을 입력하셨습니다.");
        }

        return new Product(
                name, description, imageUrl,
                price, stock, category, status
        );
    }

    // 상품 업데이트(부분 수정을 위해 null 체크)
    public void updateProduct(String name, String description, String imageUrl,
                                 Integer price, Integer stock,
                                 String category, ProductStatus status){
        if(name != null && !name.isBlank()) this.name=name;
        if(description != null && !description.isBlank()) this.description=description;
        if(imageUrl != null && !imageUrl.isBlank()) this.imageUrl=imageUrl;
        if(price!=null)this.price=price;
        if(stock!=null) this.stock=stock;
        if(category!= null && !category.isBlank()) this.category=category;
        if(status!=null) this.status=status;

        // 수정일 자동 업데이트
        // String의 경우 ""도 null이 아니라고 받아서 저장해버림 -> 이를 막기위해 && !name.isBlank()사용

    }

    // 상품 구매 시, 재고 차감용 메서드
    public void buy(int quantity){
        //stock(재고 수량), quantity(구매 수량)

        if(quantity <= 0){
            throw new IllegalStateException("잘못된 구매 수량을 입력하셨습니다.");
        }
        if(this.stock < quantity){
            throw new IllegalStateException("재고가 부족합니다.");
        }
        this.stock -= quantity; //구매 성공 + 재고 차감

        if(this.stock == 0){
            this.status = ProductStatus.SOLD_OUT; //재고 0 -> 품절처리
        }
    }

    // 핫딜 재고 이동용 메서드
    public void allocateToHotDeal(int hotDealStock){
        if(hotDealStock <= 0){
            throw new IllegalStateException("잘못된 핫딜 재고 할당 요청입니다.");
        }
        if(this.stock < hotDealStock){ //할당 재고 부족시 예외
            throw new IllegalStateException("일반 상품 재고가 부족하여 핫딜 재고를 할당 할 수 없습니다.");
        }
        this.stock -= hotDealStock; //일반 재고 차감
    }
    // 남은 핫딜 재고 반환
    public void restoreFromHotDeal(int hotDealStock){
        if(hotDealStock<=0){
            throw new IllegalStateException("추가하려는 재고가 0 이하입니다.");
        }
        this.stock+=hotDealStock;
    }
}