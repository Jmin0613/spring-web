package demo.demo_spring.wishlist.service;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.repository.ProductRepository;
import demo.demo_spring.wishlist.domain.Wishlist;
import demo.demo_spring.wishlist.dto.WishlistListResponse;
import demo.demo_spring.wishlist.dto.WishlistToggleResponse;
import demo.demo_spring.wishlist.repository.WishlistRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class WishlistService {
    private final WishlistRepository wishlistRepository;
    private final MemberService memberService;
    private final ProductRepository productRepository;

    public WishlistService(WishlistRepository wishlistRepository,
                           MemberService memberService, ProductRepository productRepository){
        this.wishlistRepository = wishlistRepository;
        this.memberService = memberService;
        this.productRepository = productRepository;
    }

    // 찜하기 Toggle
    public WishlistToggleResponse toggle(Long productId, Long memberId){
        // 멤저, 상품 조회
        Member member = memberService.getMember(memberId);
        Product product = productRepository.findById(productId)
                .orElseThrow(()-> new IllegalStateException("찜하시려는 상품이 없습니다."));

        // 현재 찜 상태 확인, 이미 찜 했는지 조회
        Optional<Wishlist> wishlist = wishlistRepository.findByMemberIdAndProductId(memberId, productId);

        if(wishlist.isPresent()){ //이미 찜했으면
            wishlistRepository.delete(wishlist.get());
            product.decreaseWishCount();
            return new WishlistToggleResponse(productId, false, product.getWishCount());
        }else { //없으면
            wishlistRepository.save(Wishlist.createWishlist(member, product));
            product.increaseWishCount();
            return new WishlistToggleResponse(productId, true, product.getWishCount());
        }
    }

    // 찜 목록 조회
    public List<WishlistListResponse> findWishlist(Long memberId){
        // 멤버 조회
        memberService.getMember(memberId);
        // 찜 목록 조회
        return wishlistRepository.findAllByMemberIdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(WishlistListResponse::fromEntity)
                .toList();

    }
}
