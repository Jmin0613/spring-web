package demo.demo_spring.product.dto;

import demo.demo_spring.product.domain.ProductStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AdminProductStatusUpdateRequest {
    // 관리자 상품관리 -> 상품 상태변경 DTO

    @NotNull(message = "변경할 상품 상태를 선택해주세요.")
    private ProductStatus status;
}
