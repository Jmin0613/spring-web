package demo.demo_spring.wishlist.domain;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.product.domain.Product;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table( //복합 unique는 컬럼 하나의 성질이 아닌, 여러 컬럼 보합에 대한 제약이라서 클래스 위에서 걸음.
        uniqueConstraints = { // 1. 유니크 제약 조건들을 걸겠다 (여러 개 가능)
                @UniqueConstraint( // 2. 개별 제약 조건 정의
                        name = "uk_wishlist_member_product", // 3. 이 제약 조건의 이름 (DB 관리용)
                        columnNames = {"member_id", "product_id"} // 4. 묶어서 유니크하게 만들 컬럼들
                )
        })
public class Wishlist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // member_id + product_id 복합 unique 제약

    @CreatedDate
    private LocalDateTime createdAt;

    private Wishlist (Member member, Product product){
        this.member = member; this.product = product;
    }

    // 찜추가 메서드
    public static Wishlist createWishlist(Member member, Product product){
        // null 체크
        if(member == null){
            throw new IllegalStateException("로그인이 필요합니다.");
        }
        if(product == null){
            throw new IllegalStateException("찜 하시려는 상품이 없습니다.");
        }
        return new Wishlist(member, product);
    }
}
