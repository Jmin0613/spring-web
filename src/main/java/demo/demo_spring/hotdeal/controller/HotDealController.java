package demo.demo_spring.hotdeal.controller;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.dto.HotDealFindResponse;
import demo.demo_spring.hotdeal.service.HotDealService;
import demo.demo_spring.member.domain.Member;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class HotDealController {

    //클라이언트(web) 요청 받아서 service로 넘길 객체 생성
    private final HotDealService hotDealService;

    //생성자주입 + di
    public HotDealController(HotDealService hotDealService){
        this.hotDealService = hotDealService;
    }

    // 1. 핫딜 전체 조회 (Get)
    @GetMapping("/hotdeals")
    public List<HotDealFindResponse> findAll(){
        return hotDealService.findAll() //List<HotDeal>
                .stream() //stream<HotDeal>
                .map(HotDealFindResponse::fromEntity)//Stream<DTO>
                .toList(); //List<DTO>
    }

    // 2. 핫딜 단건 조회 (Get)
    @GetMapping("/hotdeals/{id}")
    public HotDealFindResponse findById(@PathVariable Long id){ //URL에서 id값 추출
        HotDeal hotDeal = hotDealService.findById(id); //꺼내오기
        return HotDealFindResponse.fromEntity(hotDeal); //DTO처리해서 보내주기
    }

    // 3. 핫딜 구매 (Post)
    @PostMapping("/hotdeals/{id}/buy")
    public String buy(@PathVariable Long id, HttpSession session){
        checkLogin(session); //로그인 체크

        hotDealService.buy(id); //사오기
        return "구매 성공";
    }

    private Member checkLogin(HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember"); //세션에서 로그인 정보 꺼내오기
        if(loginMember == null){
            throw new IllegalStateException(("로그인 필요"));
        }
        return loginMember;
    }
}
/*
    Delete에서는 @RequestBody없이 그냥 id만 url로 받는게 좋다 생각함.
    request body는 보통 보내야 할 데이터가 덩어리가 있을 때 많이 쓰는데,
    delete에서 지금 필요한 건 어떤 대상을 지울지 알려주는 id하나뿐이니간.
    그러면 그 id는 url경로에 두는게 왠지 더 자연스럽게 간단할듯.

    URL : 무엇을 삭제할가?
    Body : 무엇으로 생성/수정할지

    근데 delete에서 body를 아예 못쓰는건 아님! 지금 같이 그냥 기본적인 delete의 경우,
    보통 url경로에 있는 id로 처리하니간. 굳이 지금은 body로 받을 필요가 없어서 그런거!
    다른 핫딜 상품 삭제가 아닌, 앞으로 만들 다른 삭제 api에서는 사용할 것 같음!
 */

/* long VS Long
long : 기본형(원시타입 primitive type). 그냥 숫자값 자체 (진짜 숫자)
Long : 참조형(참조타입 wrapper class). long을 객체처럼 감싼 형태 (숫자 담고있는 객체)

원시타입 long은 직접 값을 할당하기에 참조 타입에 비해 유리하다.
원시타입은 Stack영역에 값이 존재하고, 참조타입은 Stack영역에는 참조 주소정보만 있지, 실제 데이터는 Heap영역에 존재하기 때문이다.
즉, 값을 가져오는 데에는 원시 타입이 속도 상 빠르다. 또한 메모리 측면에서도 원시타입을 사용하는 게 좋다.

그러나, 원시타입 long은 null 할당이 불가능하다. 하지만 참조타입 Long은 가능하다. 이게 가장 큰 차이점이다.
원시타입long이 null을 할당 불가능이라해서 null을 필요로 하지 않는건 아니다.
그래서 원시 타입을 참조타입으로 변환하는 Boxed Primitive type인 Wrapper Class를 사용한다.

그렇다면 도메인에서 id값에 Long을 사용하는 이유는 뭘까?
도메인 영역에서 id는 대체로 db테이블의 auto increment값을 의미하는 경우가 많다.
(auto increment : db시스템에서 자동으로 순차적인 번호를 생성해주는 기능)
즉, 데이터가 생성되는 시점에서 해당값이 할당된다는 건데...
도메인의 id는 특정 시점에 존재할수도 잇고 아닐수도잇다. 그렇기 때문에 Long을 사용한다.
근데 not null보장된다면 성능면에서 long을 사용하는게 좋다.

+@@@ 추가. id가 있을수도 없을수도 있다는 것은,
처음에 객체를 new로 생성했을떄, hotDeal = new HotDeal("자바"); 이렇게 하는데.
이 시점에는 자바 메모리에만 존재하고 db 넣기 전에이라 id가 없음. 이런 경우 id값이 없기도 한 것.
이 다음에 repository에 repository.save(hotDeal);하면서 db에 insert쿼리날아가면
db가 그제서야 id를 할당해주는거임.

+@@@@@@ 또 추가. 조금 더 공부해보니, List<long>은 안되고 List<Long>은 된다.
그동안은 그냥 버릇처럼 List<Long>을 썻는데,
자바의 제네릭은 기본형을 직접 못받아서, 리스트나 맵같은 컬렉션에는 Long을 쓰는거였음.
그리고 Long은 객체라서 서로 비교할때 == 보다는 .equals()를 쓰는게 더 적절함.
이전에는 그냥 처음배울떄 그렇게 햇어서 버릇처럼 썻는데 알고보니 이런 이유들이 있었네... 재밋다!

+@@@@@@@@@@ 또또 추가.. 확장적으로 또 궁금해짐.
왜 컨트롤러의 @PathVariable에서는 실제로 값이 들어오는 경우가 많은데도 굳이 Long으로 통일하려는 걸가?
컨트롤러에서 DTO에 담기 때문일가 햇는데, 프로젝트 전체에서 id타입을 일관되게 만들기 위해서였음.
그리고 @PathVariable로 url에서 값을 string으로 받아오면
그걸 스프링이 알아서 변환해주는건데 long,Long 둘 다 가능함.
그런데 컨트롤러,서비스,엔티티 싹 다 하나로 통일하는게 좋아서 이것도 Long으로 통일.
-> 즉, @PathVariable 에서 Long을 쓰는 이유는
컨트롤러, 서비스, 엔티티(그리고 레포지토리) 의 id 타입을 통일하기 위해서.
 */