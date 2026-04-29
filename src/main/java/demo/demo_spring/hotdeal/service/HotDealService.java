package demo.demo_spring.hotdeal.service;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.domain.HotDealStatus;
import demo.demo_spring.hotdeal.dto.*;
import demo.demo_spring.hotdeal.repository.HotDealRepository;
import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.order.domain.DeliveryInfo;
import demo.demo_spring.order.domain.PaymentMethod;
import demo.demo_spring.order.dto.DeliveryInfoRequest;
import demo.demo_spring.order.service.OrderService;
import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;

import static demo.demo_spring.hotdeal.domain.HotDealStatus.*;

@Service
@Transactional
public class HotDealService {
    //Repository 주입 + DI
    private final HotDealRepository hotDealRepository;
    private final ProductRepository productRepository;
    private final OrderService orderService;
    private final MemberService memberService;
    private final HotDealRedisStockService hotDealRedisStockService;

    public HotDealService(HotDealRepository hotDealrepository,
                          ProductRepository productRepository, OrderService orderService, MemberService memberService, HotDealRedisStockService hotDealRedisStockService){
        this.hotDealRepository = hotDealrepository;
        this.productRepository = productRepository;
        this.orderService = orderService;
        this.memberService = memberService;
        this.hotDealRedisStockService = hotDealRedisStockService;
    }

    // 핫딜 등록
    public Long create(HotDealCreateRequest request){
        // productId로 Product조회 -> 없으면 예외
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(()-> new IllegalStateException("등록하려는 핫딜의 원본 상품이 없습니다."));

        // HotDeal.createHotDeal() 호출
        LocalDateTime now = LocalDateTime.now();
        HotDeal hotDeal = HotDeal.createHotDeal(
                product, request.getHotDealPrice(), request.getHotDealStock(),
                request.getStartTime(), request.getEndTime(), now
        );

        // 저장
        HotDeal savedHotDeal = hotDealRepository.save(hotDeal);
        return savedHotDeal.getId();
    }

    // 핫딜 수정
    public void update(Long id, HotDealUpdateRequest request) {
        // hotDealId로 HotDeal조회 -> 없으면 예외
        HotDeal hotDeal = hotDealRepository.findById(id)
                .orElseThrow(()-> new IllegalStateException("해당하는 핫딜이 없습니다."));

        // HotDeal.updateHotDeal() 호출
        hotDeal.updateHotDeal(
                request.getHotDealPrice(), request.getHotDealStock(),
                request.getStartTime(), request.getEndTime()
        );

        //save안해도 됨 -> jpa 더티체킹
    }

    // 관리자 긴급 중단
    public void adminEmergencyStop(Long id){
        HotDeal hotDeal = hotDealRepository.findById(id)
                        .orElseThrow(()->new IllegalStateException("해당하는 핫딜이 없습니다."));
        hotDeal.adminEmergencyStop();
    }

    // 관리자 중단 재개
    public void adminResume(Long id){
        HotDeal hotDeal = hotDealRepository.findById(id)
                .orElseThrow(()-> new IllegalStateException("해당하는 핫딜이 없습니다."));
        LocalDateTime now = LocalDateTime.now();
        hotDeal.adminResume(now);
    }

    // 핫딜 삭제
    public void delete(Long id){
        // 삭제 전 핫딜 상품 존재 여부 확인
        HotDeal hotDeal = hotDealRepository.findById(id)
                .orElseThrow(()-> new IllegalStateException("해당하는 핫딜이 없습니다.")); //없으면 예외
        hotDeal.returnRemainingStockToProduct(); // 삭제 전 남은 재고 반환
        hotDealRepository.delete(hotDeal); // 삭제
    }

    // 관계자 핫딜 전체 조회
    public List<AdminHotDealListResponse> adminFindAllHotDeal(){
        LocalDateTime now = LocalDateTime.now();
        return hotDealRepository.findAll() // List<HotDeal>
                .stream()
                .peek(h -> h.refreshStatus(now)) //조회할 때 현재 시간 기준으로 상태 확인
                .map(AdminHotDealListResponse::fromEntity) //Stream<DTO>
                .toList(); //List<DTO>
    }
    // 관계자 핫딜 단건 조회
    public AdminHotDealDetailResponse adminFindHotDeal(Long id){
        LocalDateTime now = LocalDateTime.now();
        HotDeal hotDeal = hotDealRepository.findById(id)
                .orElseThrow(()->new IllegalStateException("해당하는 핫딜이 없습니다."));
        hotDeal.refreshStatus(now); //조회할 때 현재 시간 기준으로 상태 확인
        return AdminHotDealDetailResponse.fromEntity(hotDeal);
    }

    // 사용자 핫딜 전체 조회
    public List<HotDealListResponse> findAllHotDeal(){
        LocalDateTime now = LocalDateTime.now();
        return hotDealRepository.findAll() // List<HotDeal>
                .stream()
                .peek(h -> h.refreshStatus(now)) //조회할 때 현재 시간 기준으로 상태 확인
                .filter(hotDeal -> hotDeal.getStatus() == ON_SALE
                        || hotDeal.getStatus() == READY)
                .map(HotDealListResponse::fromEntity) //Stream<DTO>
                .toList(); //List<DTO>
    }
    // 사용자 핫딜 단건 조회
    public HotDealDetailResponse findHotDeal(Long id){
        LocalDateTime now = LocalDateTime.now();
        HotDeal hotDeal = hotDealRepository.findById(id)
                .orElseThrow(()-> new IllegalStateException("해당하는 핫딜이 없습니다."));
        hotDeal.refreshStatus(now); //조회할 때 현재 시간 기준으로 상태 확인
        if(hotDeal.getStatus() == HotDealStatus.SOLD_OUT){
            throw new IllegalStateException("현재 재고 소진으로 품절된 핫딜입니다.");
        }
        if(hotDeal.getStatus() == HotDealStatus.END){
            throw new IllegalStateException("이미 판매가 종료된 핫딜입니다.");
        }
        return HotDealDetailResponse.fromEntity(hotDeal);
    }

    // 사용자 핫딜 구매 + Pessimistic Lock
    // 지금 buy쪽이 파라미터가 너무 많은데, 나중에 DTO자체를 서비스로 넘기는 구조 생각해보기. (유지보수? 확장 가능할 듯)
    public Long buy(Long id, Integer quantity, Long memberId,
                    DeliveryInfoRequest deliveryInfoRequest, PaymentMethod paymentMethod){
        // 회원 조회
        Member member = memberService.getMember(memberId);

        // 수량 체크
        if(quantity == null){
            throw new IllegalStateException("구매 수량이 누락되었습니다.");
        }

        // hoDeal 일반 조회
        HotDeal hotDeal = hotDealRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("해당하는 핫딜이 없습니다.")); //없으면 예외 던지기
        // 판매 상태 확인
        if(hotDeal.getStatus() != HotDealStatus.ON_SALE){
            throw new IllegalStateException("현재 판매 중인 핫딜이 아닙니다.");
        }

        // Redis 재고 차감 시도
        boolean success = hotDealRedisStockService.decreaseStock(id, quantity);
        if(!success){
            throw new IllegalStateException("판매 재고가 부족합니다.");
        }

        // Redis 재고 차감 성공 후, 주문 생성
        try{
            DeliveryInfo deliveryInfo = toDeliveryInfo(deliveryInfoRequest);
            return orderService.createSingle(
                    member, hotDeal.getProduct(),
                    quantity, hotDeal.getHotDealPrice(),
                    deliveryInfo, paymentMethod
            );

        } catch (Exception e){ // 주문 생성 실패시, Redis 재고 복구
            hotDealRedisStockService.increaseStock(id, quantity);
            throw e;
        }

    }
    // 배송 정보
    private DeliveryInfo toDeliveryInfo(DeliveryInfoRequest request){
        return new DeliveryInfo(
                request.getReceiverName(), request.getPhoneNumber(), request.getAddress(), request.getDeliveryMemo()
        );
    }

    // 상태 변경 처리 + Redis 적재/삭제 처리 (스케쥴러에서 대상찾고, 서비스에서 처리)
    public void refreshHotDealStatus(HotDeal hotDeal, LocalDateTime now){
        // 변경 전 상태 저장
        HotDealStatus beforeStatus = hotDeal.getStatus();

        // hotDeal.refreshStatus(now) 호출
        hotDeal.refreshStatus(now);

        // 상태 변경 확인
        HotDealStatus afterStatus = hotDeal.getStatus();

        // READY -> ON_SALE이면 판매시작. redis setStock() 재고 적재
        if(beforeStatus == HotDealStatus.READY && afterStatus == HotDealStatus.ON_SALE){
            hotDealRedisStockService.setStock(hotDeal.getId(), hotDeal.getHotDealStock());
        }

        // ON_SALE -> STOPPED이면 일시중지.
        // ON_SALE -> END이면 완전 종료. redis deleteStock() 재고 삭제
        if(beforeStatus == HotDealStatus.ON_SALE && afterStatus == END){
            // Redis에서 남은 재고 수량 읽어오기
            int remainingStock = hotDealRedisStockService.getStock(hotDeal.getId());
            // HotDeal 재고에 반영
            hotDeal.syncHotDealStock(remainingStock);
            // 원 상품에 HotDeal 재고 반환
            hotDeal.returnRemainingStockToProduct();
            // Redis key 삭제
            hotDealRedisStockService.deleteStock(hotDeal.getId());
        }

//        System.out.println("beforeStatus = " + beforeStatus);
//        System.out.println("afterStatus = " + afterStatus);
//        System.out.println("hotDealId = " + hotDeal.getId());
//
//        if (beforeStatus == HotDealStatus.READY && afterStatus == HotDealStatus.ON_SALE) {
//            System.out.println("Redis setStock 실행");
//            hotDealRedisStockService.setStock(hotDeal.getId(), hotDeal.getHotDealStock());
//        }
//
//        System.out.println("현재 DB status = " + hotDeal.getStatus());

    }
}