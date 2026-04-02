package demo.demo_spring.product.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ProductBuyRequest { // 확장성을 위해 DTO 생성
    private Integer quantity; //주문수량 누락 시 0으로 안받게 Integer 선언
}
