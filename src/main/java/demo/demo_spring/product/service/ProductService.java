package demo.demo_spring.product.service;

import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.domain.ProductStatus;
import demo.demo_spring.product.dto.*;
import demo.demo_spring.product.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class ProductService {
    // createdAt, updatedAt 넣기
    // 기본 status = ON_SALE 넣기
    // DTO 값을 엔티티로 조립하기
    // ---> 엔티티를 그대로 받기보다 요청 DTO를 받아서 엔티티를 만드는 흐름
    // ---> 비즈니스 규칙 + DTO 변환을 맡는 곳이 됨

    //repository 주입 + DI
    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository){ //외부에서 받은 ProductRepository를
        this.productRepository = productRepository; //이 클래스에서 사용하기 위해 저장
    }


    //등록
    public Long create(ProductCreateRequest request){
        // 요청값 받음 -> 현재 시간 만듦 -> Product생성 맡김 -> 저장

        // 현재 시간 만듦
        LocalDateTime now = LocalDateTime.now();

        //Product생성 메서드 호출 -> 엔티티 메서드로 보내서 도메인에 생성규칙 모아버리기
        Product product = Product.createProduct(
                request.getName(), request.getDescription(), request.getImageUrl(),
                request.getPrice(), request.getStock(), request.getCategory(),
                now, ProductStatus.ON_SALE
        );

        // 저장
        Product savedProduct = productRepository.save(product);

        return savedProduct.getId(); //저장한 상품 id 반환

        /* 도메인 생성 규칙을 한 곳에 모은 이유 : 객체가 생성될 때 필요한 초기 상태와 제약을 일관되게 보장하기 위해
        규칙이 서비스마다 흩어지면 중복과 누락이 생길 수 있음.
        고로, 변경 포인트를 줄이고 정상 상태의 객체를 만들기 쉽게 하려고 함.
         */
    }

    //수정
    public void patch(Long id, ProductUpdateRequest request){
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("상품 없음"));
        product.updateProduct(
                request.getName(), request.getDescription(), request.getImageUrl(),
                request.getPrice(), request.getStock(), request.getCategory(),
                request.getStatus(), LocalDateTime.now()
        );
    }
        /* 원래 update000()스타일로 다 만들가했는데, 그냥 updateProduct()하나에 모아서 코드 조금 더 단순하게 했음
        아직까지는 괜찮은데, 더 늘어나거나 검증 규칙 복잡해지면 분리하는 것 염두해 두는 중.
         */

    //삭제
    public void delete(Long id){
        Product product = productRepository.findById(id)
            .orElseThrow(()->new IllegalStateException("상품 없음"));

        productRepository.delete(product);
    }

    //관리자 전체조회
    public List<AdminProductListResponse> adminFindAllProduct(){
        return productRepository.findAll() //List<Product>
                .stream().map(AdminProductListResponse::fromEntity) //Stream<DTO>
                .toList(); //List<DTO>
    }
    //관리자 단건 상세조회
    public AdminProductDetailResponse adminFindProduct(Long id){
        Product product = productRepository.findById(id)
                .orElseThrow(()->new IllegalStateException("해당 상품 없음"));
        return AdminProductDetailResponse.fromEntity(product);
    }

    //사용자 전체조회
    public List<ProductListResponse> findAllProduct(){
        return productRepository.findAll() //List<Product>
                .stream().map(ProductListResponse::fromEntity) //Stream<DTO>
                .toList(); //List<DTO>
    }
    //사용자 단건 상세조회
    public ProductDetailResponse findProduct(Long id){
        Product product = productRepository.findById(id)
                .orElseThrow(()->new IllegalStateException("상품 없음"));
        // 상품이 HIDDEN 비공개 상태일때 안보이게 하기
        if (product.getStatus() == ProductStatus.HIDDEN){
            throw new IllegalStateException("현재 판매되는 상품이 아님");
        }
        return ProductDetailResponse.fromEntity(product);
    }

    // 사용자 상품 구매 + Pessimistic Lock
    public void buy(Long id, Integer quantity){
        // quantity를 Integer로 받아서 null 체크
        if(quantity == null){
            throw new IllegalStateException("구매 수량 누락");
        }

        // 업데이트 시간
        LocalDateTime now = LocalDateTime.now();

        //1. 비관적 락을 이용해 id를 넣어 상품 가져오기
        Product product = productRepository.findByIdWithPessimisticLock(id)
                .orElseThrow(()->new IllegalStateException("상품 없음"));
        //2. 판매 상태 확인
        if(product.getStatus()==ProductStatus.HIDDEN){
            throw new IllegalStateException("현재 판매하지 않는 상품");
        }
        //3. 재고,수량 체크 + 구매 진행하는 엔티티메서드
        product.buy(quantity, now);

        // 락 조회 : Service/Repository
        //재고 차감 규칙 : Entity
    }
}
