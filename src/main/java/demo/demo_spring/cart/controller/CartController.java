package demo.demo_spring.cart.controller;

import demo.demo_spring.cart.dto.*;
import demo.demo_spring.cart.service.CartService;
import demo.demo_spring.member.domain.Member;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class CartController {
    // 공통 상수
    private static final String GUEST_CART_COOKIE_NAME = "guestCartToken";

    private final CartService cartService;

    public CartController(CartService cartService){
        this.cartService = cartService;
    }

    // 내 장바구니 담기
    @PostMapping("/products/{productId}/cart-items")
    public Long create(@PathVariable Long productId,@RequestBody @Valid CartItemCreateRequest request,
                       HttpSession session, HttpServletRequest servletRequest, HttpServletResponse servletResponse){
        // 카트를 가져오거나 만들기 전, 요청하는 사용자가 회원인지 비회원이지 확인

        // 1. 회원인지 확인
        Member loginMember = (Member)session.getAttribute("loginMember");

        // 1-2. 회원일 경우 회원id 넘겨주기
        if (loginMember != null) {
            return cartService.create(productId, loginMember.getId(), null, request);
        }

        // 2. 위 과정 통과시, 비회원판별. 토큰 생성 또는 기존 토큰 재사용
        String guestToken = getOrCreateGuestCartToken(servletRequest, servletResponse);

        // 2-1. 비회원용 토큰을 HttpServletResponse에 쿠키로 실어 보냄.
        return cartService.create(productId, null, guestToken, request);
    }

    // 장바구니 만들어진 뒤에는 새 토큰 만들 필요 X. 기존 쿠키만 읽으면 됨
    // -> 다른 메서드에서는 HttpServletResponse X.

    // 내 장바구니 수정
    @PatchMapping("/cart-items/{cartItemId}") // "/cartItems/**" 인터셉터 경로 추가
    public void update(@PathVariable Long cartItemId, @RequestBody @Valid CartItemUpdateRequest request,
                       HttpSession session, HttpServletRequest servletRequest){
        // 회원일 경우, 세션에서 로그인 정보 꺼내오기
        Member loginMember = (Member)session.getAttribute("loginMember");

        // 비회원일 경우, 쿠키에서 토큰 꺼내오기
        String guestToken = getGuestCartToken(servletRequest); //회원이어서 토큰 없을 경우, null반환

        cartService.update(
                cartItemId,
                loginMember != null ? loginMember.getId() : null, // 회원일 경우 id넘겨주고, 아니면 null
                guestToken, request
        );
    }

    // 내 장바구니 삭제
    @DeleteMapping("/cart-items/{cartItemId}")
    public void delete(@PathVariable Long cartItemId, HttpSession session, HttpServletRequest servletRequest){
        // 회원 : 세션에서 id꺼내기, 비회원 : 쿠키에서 token꺼내기
        Member loginMember = (Member)session.getAttribute("loginMember");
        String guestToken = getGuestCartToken(servletRequest);

        cartService.delete(
                cartItemId,
                loginMember != null ? loginMember.getId() : null,
                guestToken
        );
    }
    // 내 장바구니 전체 삭제
    @DeleteMapping("/cart-items")
    public void deleteAll(HttpSession session, HttpServletRequest servletRequest){
        // 회원 : 세션에서 id꺼내기, 비회원 : 쿠키에서 token꺼내기
        Member loginMember = (Member)session.getAttribute("loginMember");
        String guestToken = getGuestCartToken(servletRequest);

        cartService.deleteAll(
                loginMember != null ? loginMember.getId() : null,
                guestToken
        );
    }

    // 내 장바구니 조회
    @GetMapping("/cart-items")
    public CartResponse findMyCartItems(HttpSession session, HttpServletRequest request){
        // 회원 : 세션에서 id꺼내어 조회
        Member loginMember = (Member)session.getAttribute("loginMember");
        if (loginMember != null) {
            return cartService.findCartItems(loginMember.getId(), null);
        }

        // 비회원 : 쿠키에서 token꺼내어 조회
        String guestToken = getGuestCartToken(request);
        if(guestToken == null || guestToken.isBlank()){ // null + blank 체크
            return CartResponse.empty(); //없으면 빈 카트 반환
        }
        return cartService.findCartItems(null, guestToken);
    }

    // 장바구니 상품 중 구매 상품 체크
    @PatchMapping("/cart-items/{cartItemId}/selection")
    public void selectCartItem(@PathVariable Long cartItemId, @RequestBody CartItemSelectionRequest request,
                               HttpSession session, HttpServletRequest servletRequest) {
        // 회원 : 세션에서 id꺼내기, 비회원 : 쿠키에서 token꺼내기
        Member loginMember = (Member) session.getAttribute("loginMember");
        String guestToken = getGuestCartToken(servletRequest);

        cartService.changeCartItemSelection(
                cartItemId,
                loginMember != null ? loginMember.getId() : null,
                guestToken, request
        );
    }

    // 내 장바구니 상품 구매 (오직 회원만 가능)
    @PostMapping("/cart-items/buy")
    public Long buyCartItems(@RequestBody @Valid CartBuyRequest request, HttpSession session){
        Member loginMember = (Member) session.getAttribute("loginMember");

        if (loginMember == null) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }

        return cartService.buyCart(loginMember.getId(), request);
    }



    /* 헬퍼 메서드 */

    // 비회원토큰guestCartToken 가져오는 메서드
    private String getGuestCartToken(HttpServletRequest servletRequest){

        if(servletRequest.getCookies() == null){ //브라우저 요청 중, 같이 보낸 쿠키 목록 가져옴
            return null; //없으면 null. (쿠키가 없다 -> guestCartToken도 없다.)
        }

        // 있는 경우 통과

        for(Cookie cookie : servletRequest.getCookies()){ //쿠키 목록을 하나씩 돌면서
            if(GUEST_CART_COOKIE_NAME.equals(cookie.getName())){ //guestCartToken이 있는지 확인
                return cookie.getValue(); //있으면 쿠키 안의 실제 값(UUID같은 문자열)을 꺼내서 반환.
            }
        }

        // 쿠키는 있었지만 그 안에 guestCartToken 없으면 null.
        return null;
    }

    // 비회원토큰guestCartToken 조회 및 생성 메서드
    private String getOrCreateGuestCartToken(HttpServletRequest servletRequest, HttpServletResponse servletResponse){
        // 토큰 정보 조회
        String guestToken = getGuestCartToken(servletRequest);

        // 있으면 가져온 토큰 그대로 반환.
        if(guestToken != null && !guestToken.isBlank()){
            return guestToken;
        }

        // 통과된 경우, 토큰이 없다 판단

        // 없으면 새로 만들기.
        String newGuestToken = UUID.randomUUID().toString();
        //UUID : Universally Unique IDentifier. 우주적으로 고유한 식별자
        //.randomUUID() : 거의 무한대에 가까운 랜덤 조합 중 하나 뽑기
        // 생서된 UUID객체는 특수한 숫자 형태. 쓰기 편하게 String으로 변환.

        // 쿠키 객체 생성
        Cookie cookie = new Cookie(GUEST_CART_COOKIE_NAME, newGuestToken);
        cookie.setPath("/"); // 사이트 전체 경로에서 이 쿠키 같이 보내기 -> 다른 페이지에서도 이 쿠키가 같이 전송됨.
        cookie.setHttpOnly(true); //프론트에서 직접 만지지 못하게 하기.
        cookie.setMaxAge(60 * 60 * 24 * 30); //쿠키 만료 시간 : 30일.

        servletResponse.addCookie(cookie); //servletResponse응답에 넣어서 브라우저에 저장

        return newGuestToken; // 브라우저 저장 후, 새로만든 토큰 반환.
    }

}
