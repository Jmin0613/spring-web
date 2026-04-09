package demo.demo_spring.review.dto;

import demo.demo_spring.order.domain.OrderItem;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ReviewCreateRequest {
    private Long orderItemId;
    private Integer rating;
    private String title;
    private String content;
}
