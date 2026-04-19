package demo.demo_spring.wishlist.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor // 응답 필드 단순 + 단순 결과 반환
public class WishlistToggleResponse {
    private Long productId;
    private boolean wished; // 찜하기 버튼 상태 변경을 위해 프론트에 넘겨줄 값
    private int wishCount;
}
