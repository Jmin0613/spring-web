package demo.demo_spring.global.interceptor;

import demo.demo_spring.member.domain.Member;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.servlet.HandlerInterceptor;

public class LoginCheckInterceptor implements HandlerInterceptor {
    /*
        컨트롤러 전에 실행될, 로그인체크 인터셉터
        preHandle() -> true 통과, false막기
        실패 시 false 대신 예외를 던지기
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {

        // 1. 브라우저가 보내는 OPTIONS 요청은 로그인 검사하지 말고 그냥 통과
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())){
            /* 브라우저가 프론트에서 백엔드로 요청할 때,
                특히 withCredentials: true같은 인증 정보가 있거나 CORS 조건이 걸리면,
                실제 요청 전에 먼저 "이 요청을 보내도 돼?"하고 확인 요청을 보냄.
                그게 OPTIONS 요청임. 그리고 이걸 프리플라이트(preFlight)라고 부름. */
            return true;
        }

        // 2. 세션 꺼내기
        HttpSession session = request.getSession(false); //없으면 그냥 null 반환
        //로그인 체크에서는 새로운 세션 만들 필요x -> false사용

        if(session == null){ //세션 없으면 막기
            throw new IllegalStateException(("로그인이 필요합니다.")); //false대신 예외 던저주기
        }// session.getAttribute()에서 npe터짐.

        // 3. 로그인 여부 체크
        Member loginMember = (Member)session.getAttribute("loginMember");

        if(loginMember== null){ //로그인 정보 없으면 막기
            throw new IllegalStateException(("로그인이 필요합니다.")); //false대신 예외 던저주기
        }

        // 통과
        return true;
    }
}
