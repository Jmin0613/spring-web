package demo.demo_spring.cart.domain;

import demo.demo_spring.product.domain.Product;
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
@Table( //복합 unique는 컬럼 하나의 성질이 아닌, 여러 컬럼 보합에 대한 제약이라서 클래스 위에서 걸음.
        uniqueConstraints = { // 1. 유니크 제약 조건들을 걸겠다 (여러 개 가능)
                @UniqueConstraint( // 2. 개별 제약 조건 정의
                        name = "uk_cartItem_cart_product", // 3. 이 제약 조건의 이름 (DB 관리용)
                        columnNames = {"cart_id","product_id"} // 4. 묶어서 유니크하게 만들 컬럼들
                )
        }
)
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // cart_id + product_id 복합 unique 제약

    private int quantity; //사용자 입장 수량

    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;

    private boolean selected; // 구매 선택 여부

    private CartItem(Product product, int quantity){
        if(product == null){
            throw new IllegalStateException("장바구니 추가하려는 상품이 없습니다.");
        }
        // 최소 수량
        if(quantity<1){
            throw new IllegalStateException("장바구니 수량이 잘못되었습니다. 수량은 최소 1개 입니다.");
        }
        this.product = product; this.quantity = quantity;
        this.selected = true; // 처음엔 체크 상태
    }

    public static CartItem createCartItem(Product product, int quantity){
        return new CartItem(product, quantity);
    }

    // Cart 연결
    void setCart(Cart cart){
        this.cart = cart;
    }

    // 구매 선택 메서드
    public void changeSelected(boolean selected){
        this.selected = selected;
    }

    // 같은 상품 다시 담을 시, 기존 수량 누적
    public void addQuantity(int quantity){
        if(quantity < 1){
            throw new IllegalStateException("장바구니 추가 수량은 1개 이상이어야 합니다.");
        }
        // 수량 및 재고 검증
        validateQuantity(this.quantity+quantity);
        // 기존 수량 누적
        this.quantity += quantity;
    }
    // 수량 수정 api 사용시, 수량 변경
    public void changeQuantity(int quantity){
        // 수량 및 재고 검증
        validateQuantity(quantity);
        // 수량 변경
        this.quantity = quantity;
    }

    // 재고/수량 검증 메서드
    private void validateQuantity(int quantity){
        // 1 이상인지
        if(quantity < 1){
            throw new IllegalStateException("장바구니 수량은 1개 이상이여야 합니다.");
        }
        // 재고 초과 아닌지
        if(quantity > product.getStock()){
            throw new IllegalStateException("준비된 수량보다 장바구니 수량이 높습니다.");
        }
    }

}
