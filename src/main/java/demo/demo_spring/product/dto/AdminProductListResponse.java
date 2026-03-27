package demo.demo_spring.product.dto;

import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.domain.ProductStatus;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AdminProductListResponse {
    // 관리자 목록. 운영 상태를 한눈에 볼 수 있는 값들만.
    private Long id;
    private String name;

    private int price;
    private int stock;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private ProductStatus status;

    //Product 생성자 -> fromEntity()가 내부에서 호출할 생성자
    private AdminProductListResponse(Product product){
        this.id = product.getId(); this.name = product.getName(); this.price = product.getPrice();
        this.stock = product.getStock(); this.createdAt = product.getCreatedAt();
        this.updatedAt = product.getUpdatedAt(); this.status = product.getStatus();
    }

    //엔티티 -> DTO
    public static AdminProductListResponse fromEntity(Product product){
        return new AdminProductListResponse(product);
    }
}
