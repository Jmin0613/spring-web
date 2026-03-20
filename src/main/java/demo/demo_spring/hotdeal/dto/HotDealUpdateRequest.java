package demo.demo_spring.hotdeal.dto;

import demo.demo_spring.hotdeal.domain.HotDeal;
import lombok.*;

@Getter
@AllArgsConstructor
public class HotDealUpdateRequest {
    //핫딜 상품 정보 업데이트할떄 사용할 DTO

    //private long id; -> 서버가 주는 상품 아이디
    private String title;
    private int price;
    private int discountPrice;
    private int quantity;

    //update는 save-insert 등록용이랑 다르게, new Entity()해서 엔티티를 새로 만들면 안됨
    /*
    등록(Create)은
    - 새로운 데이터가 생김
    - 그래서 DTO -> new Entity()가 맞음
    - save()하면 insert됨

    수정(Update)은
    - 이미 db에 있는 데이터를 바꿈
    - 그래서 findById로 기존 Entity를 가져와서
    - setTitle(...), setPrice(...)처럼 값만 바꿈
    - 트랜잭션 안이면 jpa가 update해줌.

    DTO를 분리하는 이유는
    1. HotDealCreateRequest : 등록할때 필요한 값만 받기
    2. HotDealUpdateRequest : 수정할때 바꿀 값만 받기
    고로 Update DTO를 만들때는, 새로운 Entity 생성 안되게 해야함.

    즉, 정리하자면
    DTO는 분리하는 게 맞지만,
    update에서는 DTO를 엔티티로 새로 만드는 게 아니라
    기존 엔티티에 DTO 값을 덮어써야 함.
     */

}
