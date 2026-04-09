package demo.demo_spring.wishlist.service;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.repository.ProductRepository;
import demo.demo_spring.wishlist.domain.Wishlist;
import demo.demo_spring.wishlist.dto.WishlistListResponse;
import demo.demo_spring.wishlist.repository.WishlistRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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

    // 찜 추가
    public Long create(Long productId, Long memberId){
        // 멤버, 상품 조회
        Member member = memberService.getMember(memberId);
        Product product = productRepository.findById(productId)
                .orElseThrow(()-> new IllegalStateException("찜 하시려는 상품이 없습니다."));

        // 중복 찜 검사
        if(wishlistRepository.existsByMemberIdAndProductId(memberId, productId)){
            throw new IllegalStateException("이미 찜 하셨습니다.");
        }

        // 찜추가 메서드 + 저장
        Wishlist wishlist = Wishlist.createWishlist(member, product);
        Wishlist savedWishlist = wishlistRepository.save(wishlist);
        return savedWishlist.getId();
    }

    // 찜 해제
    public void delete(Long productId, Long memberId){
        // 멤버, 상품 조회
        memberService.getMember(memberId);
        productRepository.findById(productId)
                .orElseThrow(()-> new IllegalStateException("찜 해제하시려는 상품이 없습니다."));
        //---> 다른 곳도 안쓰는 거 리팩토링으로 정리해주기

        // 해제할 찜 조회
        Wishlist wishlist = wishlistRepository.findByMemberIdAndProductId(memberId, productId)
                .orElseThrow(()-> new IllegalStateException("해제할 찜이 없습니다."));

        // 삭제
        wishlistRepository.delete(wishlist);
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
