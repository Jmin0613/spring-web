package demo.demo_spring.product.dto;

import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.domain.ProductStatus;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AdminProductDetailResponse {
    private Long id;
    private String name;

    private String description;
    private String imageUrl;

    private int price;
    private int stock;
    private String category;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private ProductStatus status;

    //Product 생성자 -> fromEntity()가 내부에서 호출할 생성자
    private AdminProductDetailResponse(Product product){
        this.id = product.getId(); this.name = product.getName();
        this.description=product.getDescription(); this.imageUrl=product.getImageUrl();
        this.price = product.getPrice(); this.stock = product.getStock(); this.category=product.getCategory();
        this.createdAt = product.getCreatedAt(); this.updatedAt = product.getUpdatedAt();
        this.status = product.getStatus();
    }

    //엔티티 -> DTO
    public static AdminProductDetailResponse fromEntity(Product product){
        return new AdminProductDetailResponse(product);
    }
}
