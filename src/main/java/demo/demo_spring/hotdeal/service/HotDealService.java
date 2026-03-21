package demo.demo_spring.hotdeal.service;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.dto.HotDealUpdateRequest;
import demo.demo_spring.hotdeal.repository.HotDealRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;

import java.time.*;
import java.util.*;

@Service //Bean등록시켜서 스프링이 관리하도록
@Transactional //트랜잭션 붙이기
public class HotDealService {
    //service 기능 제공 : 1. 저장   2. 조회   3.구매(수량 감소)

    //Repository를 주입. 근데 이제 di를 섞어서.
    private final HotDealRepository hotDealRepository;
    //private으로 다른 패키지에서 접근x. final로 불변성 보장.

    //di중, 생성자 주입으로 넣어주기
    public HotDealService(HotDealRepository hotDealrepository){ //외부에서 받은 HotDealRepository를
        this.hotDealRepository = hotDealrepository; //이 클래스에서 사용하기 위해 저장
    }

    // 1. 핫딜 저장
    public Long save(HotDeal hotDeal){
        hotDealRepository.save(hotDeal); //jpa는 save 기본 제공
        return hotDeal.getId(); //저장 후 핫딜 상품 id 반환
    }

    // 2-1. 핫딜 전체 조회
    public List<HotDeal> findAll(){
        return hotDealRepository.findAll(); //jpa 내장메서드 사용
    }
    // 2-2. 핫딜 단건 조회
    public HotDeal findById(Long id){
        return hotDealRepository.findById(id)
                .orElseThrow(()->new IllegalStateException("핫딜 없음"));
    }

    // 3. 핫딜 상품 구매
    public void buy(Long id){ //반환해줄거 없으니간 void
        LocalDateTime now = LocalDateTime.now();

        //핫딜 조회byId
        HotDeal hotDeal = hotDealRepository.findById(id)
                .orElseThrow(()->new IllegalStateException("핫딜 없음"));
        //Optional.orElseThrow() -> 값이 있으면 꺼내고, 없으면 예외 던짐 (값 없으면 예외 던지는 Optional 처리)
        //()->new IllegalStateException("핫딜 없음")); : 이런 예외를 만들어라
        /*
        findById는 Optional로 값을 감싸서 반환함
        그래서 실제 값을 쓸려고 Optional을 꺼내기 위해, orElse / orElseThrow를 사용
         */

        // 핫딜 시작 전 -> 구매불가
        if(now.isBefore(hotDeal.getStartTime())){
            throw new IllegalStateException("판매 시작 전");

        }
        // 핫딜 종료 -> 구매불가
        if(now.isAfter(hotDeal.getEndTime())){
            throw new IllegalStateException("판매 종료");
        }
        //재고 확인
        if(hotDeal.getQuantity() <= 0){
            throw new IllegalStateException("재고 없음"); //재고 없으면 예외 던지기
        }

        //재고 감소 -> 재고 없으면 어차피 여기까지 안내려옴
        hotDeal.setQuantity(hotDeal.getQuantity()-1); //건당 1개 구매로치고, -1

        //감소한 재고 저장
        // hotDealRepository.save(hotDeal); -> save안해도 트랙잭션안에서 감지하므로 필요없음.
        // 트랜잭션 끝날 때 자동으로 db반영. 객체만 바꿔도 db가 따라 바뀜.
        // 또한 save()를 해주면 새로 insert되는거 아닌가 했는데,
        // jpa 안에서, id 있으면 update/ 없으면 insert 였음.
        // save는 insert + update 둘 다 한다
    }

    //4. 핫딜 상품 정보 업데이트
    public void update(Long id, HotDealUpdateRequest request) {
        HotDeal hotDeal = hotDealRepository.findById(id)
                .orElseThrow(()-> new IllegalStateException("핫딜 없음"));

        hotDeal.setTitle(request.getTitle());
        hotDeal.setPrice(request.getPrice());
        hotDeal.setDiscountPrice(request.getDiscountPrice());
        hotDeal.setQuantity(request.getQuantity());
        //save안해도 됨 -> jpa 더티체킹
    }

    //5. 핫딜 상품 정보 삭제
    public void delete(Long id){
        //id로 삭제해야 할 핫딜 상품이 실제로 존재하는지, 존재 확인
        HotDeal hotDeal = hotDealRepository.findById(id)
                .orElseThrow(()-> new IllegalStateException("핫딜 없음")); //없으면 예외
        
        hotDealRepository.delete(hotDeal); //있으면 삭제
    }
}

    /*
    delete는 update보다 단순. update는 어떤값을 어떻게 바꿀지 받아야하는데,
    delete는 어떤 대상을 지울지만 알면 되기 때문. -> id 하나로 처리가능! 대신 삭제 전에 존재확인이 필요할듯

    그리고 생각이 깊어졌다 -> Delete도 DTO가 필요할가..?
    save : 새 데이터를 받아서 저장해야 함
    update : 기존 데이터를 수정해야 함
    delete : 보통 대상 하나를 찾아서 지우기만 하면 됨
    이러니간 Delete에서는 보통 id 하나만 있으면 충분한 경우가 많으니간 DTO 따로 안만들어도 될 거 같음.
    애초에 DTO는 무조건 만드는게 아니라, 외부에서 받아야 할 데이터를 담는 그릇이니간.

    그러니간 id하나만 필요할때 DTO 필요없고, 2개 이상부터 필요!
    ----> 이거 틀렸음!!!!!!!!!!!!! 데이터 2개 이상이면 DTO가 필요한게 아님.
    중요한건 "받는 값이 단순한가? 의미있는 묶음인가?" 이거임.
    값이 여러개면 당연히 DTO를 쓰는게 보통 더 좋겠지만, 핵심은 값 개수보다는 "구조와 역할"!
     */
