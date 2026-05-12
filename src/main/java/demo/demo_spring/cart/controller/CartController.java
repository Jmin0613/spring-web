package demo.demo_spring.cart.controller;

import demo.demo_spring.cart.dto.*;
import demo.demo_spring.cart.service.CartService;
import demo.demo_spring.member.domain.Member;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CartController {
    // 공통 상수
    private static final String GUEST_CART_COOKIE_NAME = "guestCartToken";

    private final CartService cartService;

    // 내 장바구니 담기
    @PostMapping("/products/{productId}/cart-items")
    public Long create(@PathVariable Long productId,@RequestBody @Valid CartItemCreateRequest request,
                       HttpSession session, HttpServletRequest servletRequest, HttpServletResponse servletResponse){
        Member loginMember = (Member)session.getAttribute("loginMember");

        if (loginMember != null) {
            return cartService.create(productId, loginMember.getId(), null, request);
        }

        // 비회원 -> 토큰 생성 또는 기존 토큰 재사용
        String guestToken = getOrCreateGuestCartToken(servletRequest, servletResponse);

        // 비회원용 토큰을 HttpServletResponse에 쿠키로 실어 보냄.
        return cartService.create(productId, null, guestToken, request);
    }

    /*
     장바구니 만들어진 뒤에는 새 토큰 만들 필요 X. 기존 쿠키만 읽으면 됨.
     -> 다른 메서드에서는 HttpServletResponse X.

     앞으로,
     회원 : 세션에서 id꺼내기, 비회원 : 쿠키에서 token꺼내기
    */

    // 내 장바구니 수정
    @PatchMapping("/cart-items/{cartItemId}") // "/cartItems/**" 인터셉터 경로 추가
    public void update(@PathVariable Long cartItemId, @RequestBody @Valid CartItemUpdateRequest request,
                       HttpSession session, HttpServletRequest servletRequest){
        Member loginMember = (Member)session.getAttribute("loginMember");
        String guestToken = getGuestCartToken(servletRequest);

        cartService.update(
                cartItemId,
                loginMember != null ? loginMember.getId() : null, // 회원일 경우 id넘겨주고, 아니면 null
                guestToken, request
        );
    }

    // 내 장바구니 삭제
    @DeleteMapping("/cart-items/{cartItemId}")
    public void delete(@PathVariable Long cartItemId, HttpSession session, HttpServletRequest servletRequest){
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
        Member loginMember = (Member)session.getAttribute("loginMember");
        if (loginMember != null) {
            return cartService.findCartItems(loginMember.getId(), null);
        }

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
        Member loginMember = (Member) session.getAttribute("loginMember");
        String guestToken = getGuestCartToken(servletRequest);

        cartService.changeCartItemSelection(
                cartItemId,
                loginMember != null ? loginMember.getId() : null,
                guestToken, request
        );
    }

    // 내 장바구니 상품 구매 (오직 회원만 가능) -> PortOne 결제 도입 후 사용x 레거시 구매API.
    @PostMapping("/cart-items/buy") // /payment/prepate -> /payment/complete로 연결
    public void legacyBuyCartItems(@RequestBody @Valid CartBuyRequest request, HttpSession session){
        throw new ResponseStatusException(
                HttpStatus.GONE,
                "기존 CartItems 구매 API는 더 이상 사용되지 않음. /paymnet/prepate 사용 바람."
        );
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
        String guestToken = getGuestCartToken(servletRequest);

        // 기존 비회원 장바구니 토큰이 있으면 그대로 사용
        if(guestToken != null && !guestToken.isBlank()){
            return guestToken;
        }

        // 없으면 새로 만들기.
        String newGuestToken = UUID.randomUUID().toString();

        // 쿠키 객체 생성
        Cookie cookie = new Cookie(GUEST_CART_COOKIE_NAME, newGuestToken);
        cookie.setPath("/"); // 사이트 전체 경로에서 이 쿠키 같이 보내기 -> 다른 페이지에서도 이 쿠키가 같이 전송됨.
        cookie.setHttpOnly(true); //프론트에서 직접 만지지 못하게
        cookie.setMaxAge(60 * 60 * 24 * 30); //쿠키 만료 시간 : 30일.

        servletResponse.addCookie(cookie); //servletResponse응답에 넣어서 브라우저에 저장

        return newGuestToken; // 브라우저 저장 후, 새로만든 토큰 반환.
    }

}
