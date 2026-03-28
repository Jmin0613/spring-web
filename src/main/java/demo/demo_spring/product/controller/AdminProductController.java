package demo.demo_spring.product.controller;

import demo.demo_spring.product.dto.AdminProductDetailResponse;
import demo.demo_spring.product.dto.AdminProductListResponse;
import demo.demo_spring.product.dto.ProductCreateRequest;
import demo.demo_spring.product.dto.ProductUpdateRequest;
import demo.demo_spring.product.service.ProductService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
public class AdminProductController {
    private final ProductService productService;

    public AdminProductController(ProductService productService) {
        this.productService = productService;
    }

    // 등록 (save -> create)
    @PostMapping("/admin/products")
    public Long create(@RequestBody ProductCreateRequest request){
        return productService.create(request); //등록한 상품의 id값 반환
    }

    // 수정
    @PutMapping("/admin/products/{id}")
    public void patch(@PathVariable Long id, @RequestBody ProductUpdateRequest request){
        productService.patch(id, request);
    }

    // 삭제
    @DeleteMapping("/admin/products/{id}")
    public void delete(@PathVariable Long id){
        productService.delete(id);
    }

    // 전체조회
    @GetMapping("/admin/products")
    public List<AdminProductListResponse> adminFindAllProduct(){
        return productService.adminFindAllProduct();
    }

    // 단건 상세조회
    @GetMapping("/admin/products/{id}")
    public AdminProductDetailResponse adminFindProduct(@PathVariable Long id){
        return productService.adminFindProduct(id);
    }
}
