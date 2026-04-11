package demo.demo_spring.cart.controller;

import demo.demo_spring.cart.dto.CartItemCreateRequest;
import demo.demo_spring.cart.dto.CartItemListResponse;
import demo.demo_spring.cart.dto.CartItemUpdateRequest;
import demo.demo_spring.cart.service.CartService;
import demo.demo_spring.member.domain.Member;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class CartController {
    private final CartService cartService;

    public CartController(CartService cartService){
        this.cartService = cartService;
    }

    // 내 장바구니 담기
    @PostMapping("/products/{productId}/cart-items")
    public Long create(@PathVariable Long productId,@RequestBody CartItemCreateRequest request,
                       HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        return cartService.create(productId, loginMember.getId(), request);
    }

    // 내 장바구니 수정
    @PatchMapping("/cart-items/{cartItemId}") // "/cartItems/**" 인터셉터 경로 추가
    public void update(@PathVariable Long cartItemId, @RequestBody CartItemUpdateRequest request,
                       HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        cartService.update(cartItemId, loginMember.getId(), request);
    }

    // 내 장바구니 삭제
    @DeleteMapping("/cart-items/{cartItemId}")
    public void delete(@PathVariable Long cartItemId, HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        cartService.delete(cartItemId, loginMember.getId());
    }

    // 내 장바구니 조회
    @GetMapping("/cart-items")
    public List<CartItemListResponse> findMyCartItems(HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        return cartService.findCartItems(loginMember.getId());
    }
}
