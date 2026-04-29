package demo.demo_spring.product.dto;

import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.domain.ProductCategory;
import demo.demo_spring.product.domain.ProductStatus;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AdminProductListResponse {
    // 관리자 목록. 운영 상태를 한눈에 볼 수 있는 값들만.
    private Long id;
    private String name;
    private String imageUrl;

    private int price;
    private int stock;
    private String category;

    private int wishCount;
    private int purchaseCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private ProductStatus status;

    //Product 생성자 -> fromEntity()가 내부에서 호출할 생성자
    private AdminProductListResponse(Product product){
        this.id = product.getId(); this.name = product.getName(); this.price = product.getPrice();
        this.stock = product.getStock(); this.createdAt = product.getCreatedAt();
        this.updatedAt = product.getUpdatedAt(); this.status = product.getStatus();
        this.category = product.getCategory().getLabel();
        this.wishCount = product.getWishCount(); this.purchaseCount = product.getPurchaseCount();
        this.imageUrl = product.getImageUrl();
    }

    //엔티티 -> DTO
    public static AdminProductListResponse fromEntity(Product product){
        return new AdminProductListResponse(product);
    }
}
