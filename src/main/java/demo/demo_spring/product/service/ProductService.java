package demo.demo_spring.product.service;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.order.domain.DeliveryInfo;
import demo.demo_spring.order.domain.PaymentMethod;
import demo.demo_spring.order.dto.DeliveryInfoRequest;
import demo.demo_spring.order.service.OrderService;
import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.domain.ProductSortType;
import demo.demo_spring.product.domain.ProductStatus;
import demo.demo_spring.product.dto.*;
import demo.demo_spring.product.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class ProductService {

    //repository 주입 + DI
    private final ProductRepository productRepository;
    private final OrderService orderService;
    private final MemberService memberService;

    public ProductService(ProductRepository productRepository, OrderService orderService, MemberService memberService){ //외부에서 받은 Repository를
        this.productRepository = productRepository; //이 클래스에서 사용하기 위해 저장
        this.orderService = orderService;
        this.memberService = memberService;
    }


    // (관리자) 등록
    public Long create(ProductCreateRequest request){
        Product product = Product.createProduct( //Product생성 메서드 호출
                request.getName(), request.getDescription(), request.getImageUrl(), request.getDetailImageUrl(),
                request.getPrice(), request.getStock(), request.getCategory(), ProductStatus.ON_SALE
        );
        Product savedProduct = productRepository.save(product); //저장
        return savedProduct.getId(); //저장한 상품 id 반환
    }

    // (관리자) 수정
    public void update(Long productIdd, ProductUpdateRequest request){
        Product product = productRepository.findById(productIdd) //id로 상품 찾기
                .orElseThrow(() -> new IllegalStateException("해당하는 상품이 없습니다.")); //없으면 예외
        product.updateProduct( //수정할 값 넣어주기
                request.getName(), request.getDescription(), request.getImageUrl(), request.getDetailImageUrl(),
                request.getPrice(), request.getStock(), request.getCategory(),
                request.getStatus()
        ); //지금은 괜찮은데, 수정할 것 더 늘거나 검증 규칙 복잡해지면 분리하는 것 고려
    }

    // (관리자) 상태변경
    public void updateStatus(Long productId, AdminProductStatusUpdateRequest request){
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalStateException("상태를 변경하려는 상품이 없습니다."));

        // 변경하려는 상태
        ProductStatus targetStatus = request.getStatus();

        // null체크
        if(targetStatus == null){
            throw new IllegalStateException("변경할 상품 상태를 선택해주세요.");
        }

        // 기존 상태와 동일
        if(product.getStatus() == targetStatus){
            return; // 통과
        }

        // 판매재개
        if (targetStatus == ProductStatus.ON_SALE) {
            product.onSale();
            return;
        }

        // 품절
        if (targetStatus == ProductStatus.SOLD_OUT) {
            product.soldOut();
            return;
        }

        // 판매중지/비공개
        if (targetStatus == ProductStatus.HIDDEN) {
            product.hide();
            return;
        }

        // 추후 상태 enum 확장 예정. 서비스로직 수정안해서 성공처리되는거 고려해서 막아두기.
        throw new IllegalStateException("변경할 수 없는 상품 상태입니다.");
    }

    // (관리자) 삭제
    public void delete(Long productId){
        Product product = productRepository.findById(productId) //id로 상품 찾기
            .orElseThrow(()->new IllegalStateException("해당하는 상품이 없습니다.")); //없으면 예외
        productRepository.delete(product);
    }
    // -> 무결성 문제때문에 현재 막힘. 생각해보니 데이터는 통계나 그런거에서 곧 자산이니간 딱히 삭제없어도 될듯.
    // 소프트 딜리트 느낌으로 전환 -> ProductStatus.HIDDEN을 통해 비공개/판매중지로 돌리기.

    // (관리자) 전체조회
    public List<AdminProductListResponse> adminFindAllProduct(){
        return productRepository.findAllByOrderByCreatedAtDesc() //List<Product>
                .stream().map(AdminProductListResponse::fromEntity) //Stream<DTO>
                .toList(); //List<DTO>
    }
    // (관리자)  단건 상세조회
    public AdminProductDetailResponse adminFindProduct(Long productId){
        Product product = productRepository.findById(productId)
                .orElseThrow(()->new IllegalStateException("해당하는 상품이 없습니다."));
        return AdminProductDetailResponse.fromEntity(product);
    } // 관리자페이지 확장할떄 정렬 추가하기

    // (사용자) 전체조회 + 정렬 추가
    public List<ProductListResponse> findAllProduct(ProductSortType sort){
        List<Product> products;

        if(sort == ProductSortType.BEST){ // 구매순 정렬
            products = productRepository.findByStatusNotOrderByPurchaseCountDescCreatedAtDesc(ProductStatus.HIDDEN);
        } else{ // 기본 -> 최신순
            products = productRepository.findByStatusNotOrderByCreatedAtDesc(ProductStatus.HIDDEN);
        }

        return products
                .stream()
                .map(ProductListResponse::fromEntity)
                .toList();

    }
    // (사용자) 단건 상세조회 + 정렬 추가
    public ProductDetailResponse findProduct(Long productId){
        Product product = productRepository.findById(productId)
                .orElseThrow(()->new IllegalStateException("해당하는 상품이 없습니다."));
        if (product.getStatus() == ProductStatus.HIDDEN){ // 상품이 HIDDEN 상태일때 숨기기
            throw new IllegalStateException("현재 판매되는 상품이 아닙니다.");
        }
        return ProductDetailResponse.fromEntity(product);
    }

    // (사용자) 단일 상품 즉시 구매 + Pessimistic Lock
    public Long buySingle(Long productId, Integer quantity, Long memberId,
                          DeliveryInfoRequest deliveryInfoRequest, PaymentMethod paymentMethod){
        Member member = memberService.getMember(memberId);

        // quantity를 Integer로 받아서 null 체크
        if(quantity == null){
            throw new IllegalStateException("구매 요청 수량이 누락되었습니다.");
        }

        //1. 비관적 락을 이용해 id를 넣어 상품 가져오기
        Product product = productRepository.findByIdWithPessimisticLock(productId)
                .orElseThrow(()->new IllegalStateException("해당하는 상품이 없습니다."));
        //2. 판매 상태 확인
        if(product.getStatus()==ProductStatus.HIDDEN){
            throw new IllegalStateException("현재 판매하지 않는 상품입니다.");
        }
        //3. 재고,수량 체크 + 구매 진행하는 엔티티메서드
        product.buy(quantity);

        //4. 구매 완료 후, 주문 생성
        // member -> 세션에서 꺼내오기
        DeliveryInfo deliveryInfo = toDeliveryInfo(deliveryInfoRequest);
        return orderService.createSingle( //생성된 orderId 넘겨주기
                member, product, quantity, product.getPrice(),
                deliveryInfo, paymentMethod
        );

        // 락 조회 : Service/Repository
        //재고 차감 규칙 : Entity
    }
    // 배송 정보
    private DeliveryInfo toDeliveryInfo(DeliveryInfoRequest request){
        return new DeliveryInfo(
                request.getReceiverName(), request.getPhoneNumber(), request.getAddress(), request.getDeliveryMemo()
        );
    }
}
