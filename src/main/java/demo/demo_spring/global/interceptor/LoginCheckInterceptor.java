package demo.demo_spring.global.interceptor;

import demo.demo_spring.member.domain.Member;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.servlet.HandlerInterceptor;

public class LoginCheckInterceptor implements HandlerInterceptor {
    //컨트롤러 전에 실행될, 로그인체크 인터셉터
    //preHandle() -> true 통과, false막기
    //실패 시 false 대신 예외를 던지기
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        //1. 세션 꺼내기
        HttpSession session = request.getSession(false);
        // getSession(), getSession(true) -> 세션 없으면 새로 생성
        // getSession(false) -> 세션 없으면 그냥 null 반환
        //로그인 체크에서는 새로운 세션 만들 필요x -> false사용

        //2 로그인 여부 체크
        if(session == null){ //세션 없으면 예외시키기
            throw new IllegalStateException(("로그인아 필요합니다.")); //false대신 예외 던저주기
        }// 세션 만약 null이면, 뒤 session.getAttribute()에서 npe터짐.

        //Object loginMember = session.getAttribute("loginMember"); //loginMember 추출
        Member loginMember = (Member)session.getAttribute("loginMember");
        // getAttribute()는 세션 안에 어떤 타입이 들어있을지 모름. -> Object로 돌려주기
        // Member라 확신하면 캐스팅

        if(loginMember== null){ //로그인 없으면 예외시키기
            throw new IllegalStateException(("로그인이 필요합니다.")); //false대신 예외 던저주기
        }
        return true;//통과
    }
}
