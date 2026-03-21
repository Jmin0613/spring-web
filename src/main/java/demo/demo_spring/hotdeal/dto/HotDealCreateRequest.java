package demo.demo_spring.hotdeal.dto;

import demo.demo_spring.hotdeal.domain.HotDeal;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class HotDealCreateRequest { //상품 등록할때 사용할 요청request DTO
    // 핫딜 상품 등록시, 필요한 데이터
    // id, title, price, discountPrice, quantity, startTime, endTime

    //private Long id; -> 서버가 주는 상품 아이디
    private String title;
    private int price;
    private int discountPrice;
    private int quantity;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    //getter setter -> lombok
    /*
    @Getter를 넣어서 getter 메서드를 자동 생성함.
    @AllArgsConstructor로 생성자를 만들어 자동으로 값을 넣음.
    원래는 setter로 값을 넣었지만, 생성자를 사용하면서 setter가 필요 없어짐.
    하지만 getter는 값을 조회하거나 json으로 응답할 때 필요하기 때문에 반드시 필요함.
     */

    //DTO -> Entity 변환. hotDeal로 넘겨주기
    public HotDeal toEntity() {
        HotDeal hotDeal = new HotDeal();
        hotDeal.setTitle(this.title);
        hotDeal.setPrice(this.price);
        hotDeal.setDiscountPrice(this.discountPrice);
        hotDeal.setQuantity(this.quantity);
        hotDeal.setStartTime(this.startTime);
        hotDeal.setEndTime(this.endTime);
        return hotDeal;
    }

}
