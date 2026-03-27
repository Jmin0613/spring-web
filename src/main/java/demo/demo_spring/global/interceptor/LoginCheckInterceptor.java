package demo.demo_spring.global.interceptor;

import demo.demo_spring.member.domain.Member;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.servlet.HandlerInterceptor;

public class LoginCheckInterceptor implements HandlerInterceptor {
    //컨트롤러 전에 실행될, 로그인체크 인터셉터
    //핵심 : preHandle() -> true 통과, false막기
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
            throw new IllegalStateException(("로그인 필요")); //false대신 예외 던저주기
        }// 세션 만약 null이면, 뒤 session.getAttribute()에서 npe터짐.

        //Object loginMember = session.getAttribute("loginMember"); //loginMember 추출
        Member loginMember = (Member)session.getAttribute("loginMember");
        // getAttribute()는 세션 안에 어떤 타입이 들어있을지 모름. -> Object로 돌려주기
        // Member라 확신하면 캐스팅

        if(loginMember== null){ //로그인 없으면 예외시키기
            throw new IllegalStateException(("로그인 필요")); //false대신 예외 던저주기
        }
        return true;//통과
    }
}



/* 컨트롤러에선 HttpSession session으로 파라미터받앗는데,
    인터셉터에선 HttpServletRequest request로 받음. 왜???

    스프링 컨트롤러의 파라미터는 argument resolver가 미리 준비.
    HttpSession session을 적어두면, 스프링이 알아서 꺼내서 전달해줌.
    그래서 복잡한 과정없이 필요한 데이터만 바로 쓸 수 있어 편리함.

    인터셉터는 컨트롤러에 가기 전 "필터 다음 단계"에서 동작함.
    이때는 아직 스프링이 데이터를 가공하기 전.
    스프링이 직접 주입해주지않고, HttpServletRequest, HttpServletResponse, handler를 줌.
    그래서 session이 필요할 경우, request에서 session을 꺼내야함.

    그리고 애초에 인터셉터는 request,response,handler 이 3개를 기준으로 동작하게 만들어짐.
    session뿐 아니라, url,헤더,쿠키,파라미터 등 요청에 담긴 모든 정보를 다 검사해야할 수도 있기 때문.
    즉, 인터셉터는 "요청 전체"를 보고 판단하는 자리라서, HttpServletRequest를 받는게 자연스러움.

    컨트롤러는 스프링이 HttpSession을 직접 주입해줄 수 있지만,
    인터셉터는 정해진 preHandle(request, response, handler) 시그니처를 구현해야 하므로
    request에서 session을 꺼내 쓰는 것이다!
    */
