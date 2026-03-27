package demo.demo_spring.product.dto;

import demo.demo_spring.product.domain.ProductStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor //기본생성자
public class ProductUpdateRequest {
    //상품 수정 요청 DTO
    private String name;
    private String description;
    private String imageUrl;

    private Integer price; //부분 수정시, 값을 안넣으면 int는 0이 들어갈 수 있음
    private Integer stock;
    private String category;

    private ProductStatus status;

    /* UpdateRequest는 클라이언트가 서버에 보내는 JSON을 받는 객체여야 함.
    사용자가 수정값 보냄 -> 스프링이 JSON을 ProductUpdateRequest로 바꿔줌 -> 서비스가 그 DTO 사용


    UpdateRequest DTO에서 생성자를 적지않고 비워두는(Lombok사용) 이유

    1. JSON을 객체로 바꿀때 기본생성자가 주인공이기 때문.
    Postman이나 프론트엔드에서 JSON데이터를 보내면, 스프링은 Jackson이라는 도구를 써서 DTO객체를 만듦.
    이때 Jackson은
    내용물이 비어있는 기본 생성자로 객체를 먼저 생성 -> set()이나 Reflection을 이용해 필드값을 하나씩 넣음
    -> 그 결과, public ProductUpdateRequst(String name, ...)같이 거창한 생성자를 만들어도,
    Jackson은 그걸 안쓰고 기본 생성자만 찾음. 그래서 굳이 복잡한 생성자 만들 필요x

    2. 수정할 필드가 많고 유동적이기 때문.
    create은 보통 모든 정보가 다 필요하지만, 업데이트는 아님.
    어떤 사람은 name만, 어떤 사람은 price만 바꾸려할 수 있음.
    생성자 방식(new DTO)을 고집하면, 수정 안해도 되는 필드까지 전부 인자로 넘겨야 해서 코드가 지저분해짐.
    그래서 기본 생성자로 객체를 만뒤, 값이 들어온 필드만 채우는 방식이 훨씬 유연하고 좋음.

    3. @Builder가 생성자를 대신해주기 때문(Lombok) -> 현재 사용x
    생성자를 직접 타이핑하는 대신 Lombok 어노테이션 사용.
    이걸 사용하면 클래스 코드 내부에는 생성자 로직이 한줄도 안보이지만(컴파일 시 자동생성),
    실제로는 가장 완벽한 형태의 생성자 구조를 갖추게 됨.

     */
}
