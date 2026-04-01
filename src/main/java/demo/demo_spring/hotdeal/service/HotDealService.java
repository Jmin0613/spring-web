package demo.demo_spring.hotdeal.service;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.domain.HotDealStatus;
import demo.demo_spring.hotdeal.dto.*;
import demo.demo_spring.hotdeal.repository.HotDealRepository;
import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.domain.ProductStatus;
import demo.demo_spring.product.repository.ProductRepository;
import demo.demo_spring.product.service.ProductService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;

import java.time.*;
import java.util.*;

import static demo.demo_spring.hotdeal.domain.HotDealStatus.*;

@Service //Bean등록시켜서 스프링이 관리하도록
@Transactional //트랜잭션 붙이기
public class HotDealService {
    //Repository 주입 + DI
    private final HotDealRepository hotDealRepository;
    private final ProductRepository productRepository;
    public HotDealService(HotDealRepository hotDealrepository,
                          ProductRepository productRepository){
        this.hotDealRepository = hotDealrepository;
        this.productRepository = productRepository;
        //HotDeal엔티티 생성에 Product 객체가 필요하기에 같이 생성
    }

    // 핫딜 등록
    public Long create(HotDealCreateRequest request){
        // productId로 Product조회 -> 없으면 예외
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(()-> new IllegalStateException("해당 상품 없음"));

        // HotDeal.createHotDeal() 호출
        HotDeal hotDeal = HotDeal.createHotDeal(
                product, request.getHotDealPrice(), request.getHotDealStock(),
                request.getStartTime(), request.getEndTime()
        );

        // 저장 및 생성된 HotDeal Id 반환
        HotDeal savedHotDeal = hotDealRepository.save(hotDeal);
        return savedHotDeal.getId();
    }

    // 핫딜 수정
    public void update(Long id, HotDealUpdateRequest request) {
        // hotDealId로 HotDeal조회 -> 없으면 예외
        HotDeal hotDeal = hotDealRepository.findById(id)
                .orElseThrow(()-> new IllegalStateException("해당 핫딜 없음"));

        // HotDeal.updateHotDeal() 호출
        hotDeal.updateHotDeal(
                request.getHotDealPrice(), request.getHotDealStock(),
                request.getStartTime(), request.getEndTime() // request.getStatus()
        );

        //save안해도 됨 -> jpa 더티체킹
    }

    // 관리자 긴급 중단
    public void adminEmergencyStop(Long id){
        HotDeal hotDeal = hotDealRepository.findById(id)
                        .orElseThrow(()->new IllegalStateException("해당 핫딜 없음"));
        hotDeal.adminEmergencyStop();
    }

    // 핫딜 삭제
    public void delete(Long id){
        // 삭제 전 핫딜 상품 존재 여부 확인
        HotDeal hotDeal = hotDealRepository.findById(id)
                .orElseThrow(()-> new IllegalStateException("핫딜 없음")); //없으면 예외
        hotDeal.returnRemainingStockToProduct(); // 삭제 전 남은 재고 반환
        hotDealRepository.delete(hotDeal); // 삭제
    }

    // 관계자 핫딜 전체 조회
    public List<AdminHotDealListResponse> adminFindAllHotDeal(){
        return hotDealRepository.findAll() // List<HotDeal>
                .stream().map(AdminHotDealListResponse::fromEntity) //Stream<DTO>
                .toList(); //List<DTO>
    }
    // 관계자 핫딜 단건 조회
    public AdminHotDealDetailResponse adminFindHotDeal(Long id){
        HotDeal hotDeal = hotDealRepository.findById(id)
                .orElseThrow(()->new IllegalStateException("해당 핫딜 없음"));
        return AdminHotDealDetailResponse.fromEntity(hotDeal);
    }

    // 사용자 핫딜 전체 조회
    public List<HotDealListResponse> findAllHotDeal(){
        return hotDealRepository.findAll() // List<HotDeal>
                .stream()
                .filter(hotDeal -> hotDeal.getStatus() == ON_SALE)
                .map(HotDealListResponse::fromEntity) //Stream<DTO>
                .toList(); //List<DTO>
    }
    // 사용자 핫딜 단건 조회
    public HotDealDetailResponse findHotDeal(Long id){
        HotDeal hotDeal = hotDealRepository.findById(id)
                .orElseThrow(()-> new IllegalStateException("해당 핫딜 없음"));
        if(hotDeal.getStatus() == HotDealStatus.READY){ // status != ON_SALE
            throw new IllegalStateException("현재 준비중인 핫딜임");
        }
        if(hotDeal.getStatus() == HotDealStatus.SOLD_OUT){
            throw new IllegalStateException("현재 품절 핫딜임");
        }
        if(hotDeal.getStatus() == HotDealStatus.END){
            throw new IllegalStateException("판매 종료된 핫딜임");
        }
        return HotDealDetailResponse.fromEntity(hotDeal);
    }

    // 사용자 핫딜 구매 + Pessimistic Lock
    public void buy(Long id, Integer quantity){
        // quantity를 Integer로 받아서 null 체크
        if(quantity == null){
            throw new IllegalStateException("구매 수량 누락");
        }

        //1. 비관적 락을 이용해 id를 넣어 해당 핫딜 상품 가져오기
        HotDeal hotDeal = hotDealRepository.findByIdWithPessimisticLock(id)
                .orElseThrow(() -> new IllegalStateException("핫딜 없음")); //없으면 예외 던지기
        //2. 재고 수량 확인
        if(hotDeal.getHotDealStock() <= 0){
            throw new IllegalStateException("재고 없음"); //재고 없으면 예외 던지기
        }
        //3. 재고가 있을시, -1 감소
        hotDeal.buy(quantity); //-> 이부분 나중에 리팩토링할때 엔티티메서드로 바꿔주자.
        //4. 비관적 락 구매 메서드끝나고, 트랜잭션 커밋될떄 자물쇠 자동으로 풀림
    }
}