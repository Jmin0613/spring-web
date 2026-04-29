package demo.demo_spring.product.dto;

import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.domain.ProductCategory;
import demo.demo_spring.product.domain.ProductStatus;
import lombok.Getter;

@Getter
public class ProductDetailResponse {
    private Long id;
    private String name;

    private String description;
    private String imageUrl;
    private String detailImageUrl;

    private int price;
    private String category;

    private ProductStatus status;
    private int wishCount;

    //Product 생성자 -> fromEntity()가 내부에서 호출할 생성자
    private ProductDetailResponse(Product product){
        this.id = product.getId(); this.name = product.getName(); this.description = product.getDescription();
        this.price = product.getPrice(); this.category=product.getCategory().getLabel();
        this.imageUrl=product.getImageUrl(); this.detailImageUrl = product.getDetailImageUrl();
        this.status = product.getStatus();
        this.wishCount = product.getWishCount();
    }

    //엔티티 -> DTO
    public static ProductDetailResponse fromEntity(Product product) {
        return new ProductDetailResponse(product);
    }
}
