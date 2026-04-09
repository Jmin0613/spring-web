package demo.demo_spring.wishlist.controller;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.wishlist.dto.WishlistListResponse;
import demo.demo_spring.wishlist.service.WishlistService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class WishlistController {
    private final WishlistService wishlistService;
    public WishlistController(WishlistService wishlistService){ this.wishlistService = wishlistService;}

    // 찜하기
    @PostMapping("/products/{productId}/wishlist")
    public Long create(@PathVariable Long productId, HttpSession session){
        Member loginMember = (Member) session.getAttribute("loginMember");
        return wishlistService.create(productId, loginMember.getId());
    }

    // 찜해제
    @DeleteMapping("/products/{productId}/wishlist")
    public void delete(@PathVariable Long productId, HttpSession session){
        Member loginMember = (Member) session.getAttribute("loginMember");
        wishlistService.delete(productId, loginMember.getId());
    }

    // 찜목록 조회
    @GetMapping("/wishlist")
    public List<WishlistListResponse> findWishlist(HttpSession session){
        Member loginMember = (Member) session.getAttribute("loginMember");
        return wishlistService.findWishlist(loginMember.getId());
    }
}
