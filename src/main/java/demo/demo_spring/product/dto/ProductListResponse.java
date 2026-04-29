package demo.demo_spring.product.dto;

import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.domain.ProductCategory;
import demo.demo_spring.product.domain.ProductStatus;
import lombok.Getter;

@Getter
public class ProductListResponse {
    private Long id;
    private String name;
    private int price;
    private String category;
    private String imageUrl;
    private ProductStatus status;
    private int purchaseCount;

    //Product 생성자 -> fromEntity()가 내부에서 호출할 생성자
    private ProductListResponse(Product product){
        this.id = product.getId(); this.name = product.getName(); this.price = product.getPrice();
        this.category = product.getCategory().getLabel();
        this.imageUrl = product.getImageUrl(); this.status = product.getStatus();
        this.purchaseCount = product.getPurchaseCount();
    }

    //엔티티 -> DTO
    public static ProductListResponse fromEntity(Product product) {
        return new ProductListResponse(product);
    }
}
