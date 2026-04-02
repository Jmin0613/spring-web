package demo.demo_spring.product.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ProductCreateRequest {
    //상품 등록 요청 DTO
    private String name;
    private String description;
    private String imageUrl;

    private int price;
    private int stock;
    private String category;

}
