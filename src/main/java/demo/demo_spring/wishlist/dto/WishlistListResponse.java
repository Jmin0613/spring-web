package demo.demo_spring.wishlist.dto;

import demo.demo_spring.wishlist.domain.Wishlist;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class WishlistListResponse {
    private Long wishlistId;
    private Long productId;
    private String productName;
    private String imageUrl;
    private int price;
    private LocalDateTime createdAt;

    private WishlistListResponse(Wishlist wishlist){
        this.wishlistId = wishlist.getId();
        this.productId = wishlist.getProduct().getId();
        this.productName = wishlist.getProduct().getName();
        this.imageUrl = wishlist.getProduct().getImageUrl();
        this.price = wishlist.getProduct().getPrice();
        this.createdAt = wishlist.getCreatedAt();
    }

    public static WishlistListResponse fromEntity(Wishlist wishlist){
        return new WishlistListResponse(wishlist);
    }
}
