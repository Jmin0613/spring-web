package demo.demo_spring.product.controller;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.product.domain.ProductSortType;
import demo.demo_spring.product.dto.ProductBuyRequest;
import demo.demo_spring.product.dto.ProductDetailResponse;
import demo.demo_spring.product.dto.ProductListResponse;
import demo.demo_spring.product.service.ProductService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class ProductController {
    // 서비스 생성 + 주입 + di
    private final ProductService productService;
    public ProductController(ProductService productService, MemberService memberService) {
        this.productService = productService;
    }

    // 전체조회
    @GetMapping("/products")
    public List<ProductListResponse> findAllProduct(@RequestParam(defaultValue = "LATEST") ProductSortType sort){ //기본값 : 최신순
        return productService.findAllProduct(sort);
    }

    // 단건 상세조회
    @GetMapping("/products/{id}")
    public ProductDetailResponse findProduct(@PathVariable Long id){
        return productService.findProduct(id);
    }

    // 상품 구매
    @PostMapping("/products/{id}/buy")
    public Long buy(@PathVariable Long id, @RequestBody @Valid ProductBuyRequest request, HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        return productService.buySingle(
                id, request.getQuantity(), loginMember.getId(),
                request.getDeliveryInfo(), request.getPaymentMethod()
        );
    }
}
