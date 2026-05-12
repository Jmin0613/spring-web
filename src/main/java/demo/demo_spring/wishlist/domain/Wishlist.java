package demo.demo_spring.wishlist.domain;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.product.domain.Product;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.*;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_wishlist_member_product",
                        columnNames = {"member_id", "product_id"}
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
        // 핵심 불변조건 체크
        if(member == null){
            throw new IllegalStateException("로그인이 필요합니다.");
        }
        if(product == null){
            throw new IllegalStateException("찜 하시려는 상품이 없습니다.");
        }
        this.member = member; this.product = product;
    }

    // 찜추가 메서드
    public static Wishlist createWishlist(Member member, Product product){
        return new Wishlist(member, product);
    }
}
