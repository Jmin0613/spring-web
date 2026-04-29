package demo.demo_spring.product.dto;

import demo.demo_spring.product.domain.ProductCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ProductCreateRequest {
    //상품 등록 요청 DTO
    @NotBlank(message = "등록하시려는 상품 이름을 입력해주세요.")
    private String name;
    @NotBlank(message = "등록하시려는 상품 설명을 입력해주세요.")
    private String description;
    @NotBlank(message = "등록하시려는 상품 대표 이미지를 입력해주세요.")
    private String imageUrl;
    @NotBlank(message = "등록하시려는 상품 상세 설명 이미지를 입력해주세요.")
    private String detailImageUrl;

    @NotNull(message = "상품 가격 입력은 필수입니다.")
    @Positive(message = "상품 가격은 1 이상이어야 합니다.")
    private Integer price;

    @NotNull(message = "상품 수량 입력은 필수입니다.")
    @Positive(message = "상품 수량은 1 이상이어야 합니다.")
    private Integer stock;

    @NotNull(message = "등록하려는 카테고리를 선택해주세요.")
    private ProductCategory category;

}
