package demo.demo_spring.cart.controller;

import demo.demo_spring.cart.dto.*;
import demo.demo_spring.cart.service.CartService;
import demo.demo_spring.member.domain.Member;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
public class CartController {
    private final CartService cartService;

    public CartController(CartService cartService){
        this.cartService = cartService;
    }

    // 내 장바구니 담기
    @PostMapping("/products/{productId}/cart-items")
    public Long create(@PathVariable Long productId,@RequestBody @Valid CartItemCreateRequest request,
                       HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        return cartService.create(productId, loginMember.getId(), request);
    }

    // 내 장바구니 수정
    @PatchMapping("/cart-items/{cartItemId}") // "/cartItems/**" 인터셉터 경로 추가
    public void update(@PathVariable Long cartItemId, @RequestBody @Valid CartItemUpdateRequest request,
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
    // 내 장바구니 전체 삭제
    @DeleteMapping("/cart-items")
    public void deleteAll(HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        cartService.deleteAll(loginMember.getId());
    }

    // 내 장바구니 조회
    @GetMapping("/cart-items")
    public CartResponse findMyCartItems(HttpSession session){
        Member loginMember = (Member)session.getAttribute("loginMember");
        return cartService.findCartItems(loginMember.getId());
    }

    // 내 장바구니 선택 구매
    @PostMapping("/cart-items/buy")
    public Long buyCart(@RequestBody @Valid CartBuyRequest request, HttpSession session){
        Member loginMember = (Member) session.getAttribute("loginMember");
        return cartService.buyCart(loginMember.getId(), request);
    }
}
