package demo.demo_spring.cart.domain;

import demo.demo_spring.member.domain.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false, unique = true)
    private Member member; // 회원당 장바구니 1개 -> unique제약

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> cartItems = new ArrayList<>(); //null안되게 바로 초기화

    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;

    private Cart(Member member){
        // member null 체크
        if(member == null){
            throw new IllegalStateException("로그인이 필요합니다.");
        }
        this.member =member;
    }

    public static Cart createCart(Member member){
        // Cart는 비어있을 수 있는게 정상 -> 따로 isEmpty() 체크 안함.
        // cartItem는 필요할때 생성 -> Cart 생성 메서드에서 x

        return new Cart(member); //member null 체크는 내부 생성자에서 진행
    } // ----------> 외부 호출용 생성 메서드와 내부 생성자에서 검증하는거 한 번 정리해서 리팩토링 필요

    // cartItem 추가 메서드
    public void addCartItem(CartItem cartItem){
        if(cartItem == null){
            throw new IllegalStateException("장바구니 추가 상품이 없습니다.");
        }
        this.cartItems.add(cartItem); // Cart입장에서 장바구니목록(cartItems) 추가
        cartItem.setCart(this); // cartItem입장에서 자신이 속할 cart를 연결
    }

    // getTotalQuantity(), getTotalPrice() 추후 추가 예정
}
