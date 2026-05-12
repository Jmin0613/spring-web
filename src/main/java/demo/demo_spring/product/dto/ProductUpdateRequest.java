package demo.demo_spring.product.dto;

import demo.demo_spring.product.domain.ProductCategory;
import demo.demo_spring.product.domain.ProductStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ProductUpdateRequest {
    //상품 수정 요청 DTO

    private String name;
    private String description;
    private String imageUrl;
    private String detailImageUrl;

    private Integer price;
    private Integer stock;
    private ProductCategory category;

    private ProductStatus status;
}
