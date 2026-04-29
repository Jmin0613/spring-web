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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; //PK
    private String name;

    private String description;
    private String imageUrl; //대표 이미지
    private String detailImageUrl; //상세 설명 이미지

    private int price;
    private int stock;

    @Enumerated(EnumType.STRING)
    private ProductCategory category;

    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    private ProductStatus status;

    @Column(nullable = false)
    private int wishCount; // 찜하기 수

    @Column(nullable = false)
    private int purchaseCount; // 누적 구매 수

    private Product (String name, String description, String imageUrl, String detailImageUrl,
                    int price, int stock, ProductCategory category, ProductStatus status){
        // 핵심 불변조건만 체크
        if(name == null || name.isBlank()){
            throw new IllegalStateException("등록할 상품의 이름을 입력해주세요.");
        }
        if(status == null){
            throw new IllegalStateException("상품 상태가 비어있습니다.");
        }
        if (price < 1){
            throw new IllegalStateException("상품 판매가격은 1 이상이어야 합니다.");
        }
        if (stock < 1){
            throw new IllegalStateException("상품 판매수량은 1 이상이어야 합니다.");
        }

        this.name = name; this.description = description;
        this.imageUrl = imageUrl; this.detailImageUrl = detailImageUrl;
        this.price = price; this.stock = stock; this.category = category; this.status = status;
        this.wishCount = 0;
        this.purchaseCount = 0;
    }

    public static Product createProduct(String name, String description, String imageUrl, String detailImageUrl,
                                        int price, int stock, ProductCategory category, ProductStatus status){
        return new Product(
                name, description, imageUrl, detailImageUrl,
                price, stock, category, status
        );
    }

    // 상품 정보 부분 수정 (부분 수정을 위해 null 체크)
    public void updateProduct(String name, String description, String imageUrl, String detailImageUrl,
                                 Integer price, Integer stock,
                              ProductCategory category, ProductStatus status){
        if(name != null && !name.isBlank()) this.name=name;
        if(description != null && !description.isBlank()) this.description=description;
        if(imageUrl != null && !imageUrl.isBlank()) this.imageUrl=imageUrl;
        if(detailImageUrl != null && !detailImageUrl.isBlank()) this.detailImageUrl=detailImageUrl;
        if(price!=null) this.price=price;
        if(stock!=null) this.stock=stock;
        if(category!= null) this.category=category;
        if(status!=null) this.status=status;
    }

    // 상품 상태변경 메서드
    public void changeStatus(ProductStatus status){
        if(status == null){
            throw new IllegalStateException("변경할 상품 상태를 선택해주세요.");
        }
        this.status = status;
    }
    // 판매 재개
    public void onSale(){ this.status = ProductStatus.ON_SALE; }

    // 품절 처리
    public void soldOut(){ this.status = ProductStatus.SOLD_OUT; }

    // 숨김 처리
    public void hide(){ this.status = ProductStatus.HIDDEN; }

    // 찜하기 수 증가
    public void increaseWishCount(){
        this.wishCount++;
    }
    // 찜하기 수 감소
    public void decreaseWishCount(){
        if(this.wishCount<=0){
            throw new IllegalStateException("찜 수는 0보다 작을 수 없습니다.");
        }
        this.wishCount--;
    }

    // 상품 구매 누적수 증가
    public void increasePurchaseCount(int quantity){
        if(quantity < 1){
            throw new IllegalStateException("증가시킬 구매 수량이 잘못되었습니다.");
        }
        this.purchaseCount += quantity;
    }
    // 상품 구매 누적수 감소
    public void decreasePurchaseCount(int quantity){
        if(quantity < 1){
            throw new IllegalStateException("감소시킬 구매 수량이 잘못되었습니다.");
        }
        if(this.purchaseCount < quantity){
            throw new IllegalStateException("구매 수는 0보다 작을 수 없습니다.");
        }
        this.purchaseCount -= quantity;
    }

    // 상품 구매 시, 재고 차감용 메서드
    public void buy(int quantity){
        //stock(재고 수량), quantity(구매 수량)

        if(quantity < 1){
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
        if(hotDealStock < 1){
            throw new IllegalStateException("잘못된 핫딜 재고 할당 요청입니다.");
        }
        if(this.stock < hotDealStock){ //할당 재고 부족시 예외
            throw new IllegalStateException("일반 상품 재고가 부족하여 핫딜 재고를 할당 할 수 없습니다.");
        }
        this.stock -= hotDealStock; //일반 재고 차감
    }

    // 통합 재고 반환
    public void restoreStock(int addStock){
        if(addStock < 1){
            throw new IllegalStateException("반환하려는 재고가 0 이하입니다.");
        }
        this.stock += addStock;
    }
}
