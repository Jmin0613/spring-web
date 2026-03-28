package demo.demo_spring.product.controller;

import demo.demo_spring.product.dto.ProductDetailResponse;
import demo.demo_spring.product.dto.ProductListResponse;
import demo.demo_spring.product.service.ProductService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
public class ProductController {
    // 서비스 생성 + 주입 + di
    private final ProductService productService;
    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // 전체조회
    @GetMapping("/products")
    public List<ProductListResponse> memberFindAllProduct(){
        return productService.memberFindAllProduct();
    }

    // 단건 상세조회
    @GetMapping("/products/{id}")
    public ProductDetailResponse memberFindProduct(@PathVariable Long id){
        return productService.memberFindProduct(id);
    }
}
