package demo.demo_spring.product.dto;

import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.domain.ProductStatus;
import lombok.Getter;

@Getter
public class ProductDetailResponse {
    private Long id;
    private String name;

    private String description;
    private String imageUrl;

    private int price;
    private String category;

    private ProductStatus status;

    //Product 생성자 -> fromEntity()가 내부에서 호출할 생성자
    private ProductDetailResponse(Product product){
        this.id = product.getId(); this.name = product.getName(); this.description = product.getDescription();
        this.price = product.getPrice(); this.category=product.getCategory();
        this.imageUrl=product.getImageUrl(); this.status = product.getStatus();
    }

    //엔티티 -> DTO
    public static ProductDetailResponse fromEntity(Product product) {
        return new ProductDetailResponse(product);
    }
}
