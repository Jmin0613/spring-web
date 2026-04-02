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

    //repository 주입 + DI
    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository){ //외부에서 받은 ProductRepository를
        this.productRepository = productRepository; //이 클래스에서 사용하기 위해 저장
    }


    //등록
    public Long create(ProductCreateRequest request){
        LocalDateTime now = LocalDateTime.now(); // 현재 시간 만듦
        Product product = Product.createProduct( //Product생성 메서드 호출
                request.getName(), request.getDescription(), request.getImageUrl(),
                request.getPrice(), request.getStock(), request.getCategory(),
                now, ProductStatus.ON_SALE
        );
        Product savedProduct = productRepository.save(product); //저장
        return savedProduct.getId(); //저장한 상품 id 반환
    }

    //수정
    public void update(Long id, ProductUpdateRequest request){
        Product product = productRepository.findById(id) //id로 상품 찾기
                .orElseThrow(() -> new IllegalStateException("해당하는 상품이 없습니다.")); //없으면 예외
        product.updateProduct( //수정할 값 넣어주기
                request.getName(), request.getDescription(), request.getImageUrl(),
                request.getPrice(), request.getStock(), request.getCategory(),
                request.getStatus(), LocalDateTime.now()
        ); //지금은 괜찮은데, 수정할 것 더 늘거나 검증 규칙 복잡해지면 분리하는 것 고려
    }

    //삭제
    public void delete(Long id){
        Product product = productRepository.findById(id) //id로 상품 찾기
            .orElseThrow(()->new IllegalStateException("해당하는 상품이 없습니다.")); //없으면 예외
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
                .orElseThrow(()->new IllegalStateException("해당하는 상품이 없습니다."));
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
                .orElseThrow(()->new IllegalStateException("해당하는 상품이 없습니다."));
        if (product.getStatus() == ProductStatus.HIDDEN){ // 상품이 HIDDEN 상태일때 숨기기
            throw new IllegalStateException("현재 판매되는 상품이 아닙니다.");
        }
        return ProductDetailResponse.fromEntity(product);
    }

    // 사용자 상품 구매 + Pessimistic Lock
    public void buy(Long id, Integer quantity){
        // quantity를 Integer로 받아서 null 체크
        if(quantity == null){
            throw new IllegalStateException("구매 요청 수량이 누락되었습니다.");
        }
        // 업데이트 시간
        LocalDateTime now = LocalDateTime.now();

        //1. 비관적 락을 이용해 id를 넣어 상품 가져오기
        Product product = productRepository.findByIdWithPessimisticLock(id)
                .orElseThrow(()->new IllegalStateException("해당하는 상품이 없습니다."));
        //2. 판매 상태 확인
        if(product.getStatus()==ProductStatus.HIDDEN){
            throw new IllegalStateException("현재 판매하지 않는 상품입니다.");
        }
        //3. 재고,수량 체크 + 구매 진행하는 엔티티메서드
        product.buy(quantity, now);

        // 락 조회 : Service/Repository
        //재고 차감 규칙 : Entity
    }
}
