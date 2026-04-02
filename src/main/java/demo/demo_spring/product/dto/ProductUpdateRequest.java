package demo.demo_spring.product.dto;

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

    private Integer price; //누락시 0 막기위해 사용
    private Integer stock;
    private String category;

    private ProductStatus status;
}
