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

        // 1. 브라우저가 보내는 OPTIONS 요청은 로그인 검사하지 말고 그냥 통과
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())){
            // request.getMethod() -> 현재 들어온 HTTP  요청 방식 알려줌
            // equalsIgnoreCase -> 요청 메서드가 "OPTIONS"와 같은지 비교. 대소문자 차이 무시.

            /* 브라우저가 프론트에서 백엔드로 요청할 때,
                특히 withCredentials: true같은 인증 정보가 있거나 CORS 조건이 걸리면,
                실제 요청 전에 먼저 "이 요청을 보내도 돼?"하고 확인 요청을 보냄.
                그게 OPTIONS 요청임. 그리고 이걸 프리플라이트(preFlight)라고 부름. */

            // 브라우저가 먼저 OPTIONS /logout 보냄
            // 서버가 "이 요청 괜찮다" 답함
            // 그 다음 진짜 POST /logout 보냄
            return true;
        }
        /* 그럼 왜 필요하냐?
            로그인 체크 인터셉터는 원래 세션있는지 확인 -> loginMember 있는지 확인 -> 없으면 "로그인이 필요" 이렇게 진행됨.
            그런데 OPTIONS 요청은 실제 로그아웃/구매/추천 요청이 아니라, 사전 확인 요청임.
            이걸 인터셉터가 로그인 검사를 해버리면, 브라우저가 보낸 OPTIONS가 막혀서 POST /logout이 못감.
            그래서 결과적으로 로그아웃이 안되는 것임. 그래서 OPTIONS를 그냥 통과시켜주는 것. */

        // 2. 세션 꺼내기
        HttpSession session = request.getSession(false);
        // getSession(), getSession(true) -> 세션 없으면 새로 생성
        // getSession(false) -> 세션 없으면 그냥 null 반환
        //로그인 체크에서는 새로운 세션 만들 필요x -> false사용

        if(session == null){ //세션 없으면 막기
            throw new IllegalStateException(("로그인이 필요합니다.")); //false대신 예외 던저주기
        }// 세션 만약 null이면, 뒤 session.getAttribute()에서 npe터짐.

        // 3. 로그인 여부 체크
        Member loginMember = (Member)session.getAttribute("loginMember");
        // getAttribute()는 세션 안에 어떤 타입이 들어있을지 모름. -> Object로 돌려주기
        // Member라 확신하면 캐스팅

        if(loginMember== null){ //로그인 정보 없으면 막기
            throw new IllegalStateException(("로그인이 필요합니다.")); //false대신 예외 던저주기
        }

        return true;//통과
    }
}
