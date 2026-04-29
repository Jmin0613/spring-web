package demo.demo_spring.product.controller;

import demo.demo_spring.product.dto.*;
import demo.demo_spring.product.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/admin/products")
public class AdminProductController {
    private final ProductService productService;

    public AdminProductController(ProductService productService) {
        this.productService = productService;
    }

    // 등록
    @PostMapping
    public Long create(@RequestBody @Valid ProductCreateRequest request){
        return productService.create(request); //등록한 상품의 id값 반환
    }

    // 수정
    @PatchMapping("/{id}")
    public void update(@PathVariable Long id, @RequestBody ProductUpdateRequest request){
        productService.update(id, request);
    }

    // 상태변경
    @PatchMapping("/{id}/status")
    public void updateStatus(@PathVariable Long id, @RequestBody @Valid AdminProductStatusUpdateRequest request){
        productService.updateStatus(id, request);
    }

    // 삭제 -> 사용x. 하드딜리트말고 소프트 딜리트로 변경.
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id){
        productService.delete(id);
    }

    // 전체조회
    @GetMapping
    public List<AdminProductListResponse> adminFindAllProduct(){
        return productService.adminFindAllProduct();
    }

    // 단건 상세조회
    @GetMapping("/{id}")
    public AdminProductDetailResponse adminFindProduct(@PathVariable Long id){
        return productService.adminFindProduct(id);
    }
}
