package demo.demo_spring.wishlist.controller;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.wishlist.dto.WishlistListResponse;
import demo.demo_spring.wishlist.dto.WishlistToggleResponse;
import demo.demo_spring.wishlist.service.WishlistService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class WishlistController {
    private final WishlistService wishlistService;
    public WishlistController(WishlistService wishlistService){ this.wishlistService = wishlistService;}

    // 찜하기/해제 -> Toggle
    @PostMapping("/products/{productId}/wishlist")
    public WishlistToggleResponse wishToggle(@PathVariable Long productId, HttpSession session){
        Member loginMember = (Member) session.getAttribute("loginMember");
        return wishlistService.toggle(productId, loginMember.getId());
    }

    // 찜목록 조회
    @GetMapping("/wishlist")
    public List<WishlistListResponse> findWishlist(HttpSession session){
        Member loginMember = (Member) session.getAttribute("loginMember");
        return wishlistService.findWishlist(loginMember.getId());
    }
}
