package demo.demo_spring.product.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor //기본생성자
public class ProductCreateRequest {
    //상품 등록 요청 DTO
    private String name;
    private String description;
    private String imageUrl;

    private int price;
    private int stock;
    private String category;

    /* 클라이언트가 ProductCreatedRequest를 보냄 -> 서비스가 받음
    -> 서비스가 직접 만듦(createdAt=now, updatedAt=now, status=ON_SALE)
    -> 서비스가 그걸 DTO값이랑 합쳐서 new Product() 생성
    즉, DTO는 입력값만 보관. 서비스는 서버 책임 값 새성. 엔티티는 둘을 합쳐서 생성.

    클라이언트 : 상품 등록 요청 보냄
    ProductCreatedRequest DTO : 그 요청 데이터를 받음
    Service : DTO에서 값 꺼내고, 서버가 책임질 값도 더함 (현재시간, 기본상태)
    Product  엔티티 : 최종 저장용 객체 생성
    DTO는 여전히 중간에 있음. 다만 DTO가 엔티티 생성까지 책임지지 않을 뿐.

    DTO에서 toEntuty()를 무조건 만드는게 아님.
    써도 괜찮은 경우가 있고 안써도 되는 경우가 있음. DTO 안 정보만으로 엔티티를 충분히 만들 수 있을 때 사용하는 것임.
    이런 경우 엔티티 생성까지 담당.
    그러나 지금은 DTO정보만으로 혼자 엔티티를 완성하기 어려움. 그래서 Service가 받아서 합쳐 만드는게 좋음.
    애초에 DTO의 역할은 외부 요청/응답을 엔티티와 분리하는 거임.
    그래서 지금처럼 DTO는 입력만 받고, Service가 엔티티를 생성하는 구조가 더 역할 분리가 잘된 것일 수 있음.
     */

}
