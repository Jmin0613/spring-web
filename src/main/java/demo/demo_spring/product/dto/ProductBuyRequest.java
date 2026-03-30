package demo.demo_spring.product.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor // 기본생성자
public class ProductBuyRequest {
    private Integer quantity; //만약 주문수량 누락일 수 있으니, 누락 시 0으로 안받게 Integer 선언

    // quantity 하나 담는 용도 -> 엔티티로 변환해서 db에 저장하라는 요청이 아님 -> toEntity필요없음
}
