package demo.demo_spring.global.interceptor;

import demo.demo_spring.member.domain.Member;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.servlet.HandlerInterceptor;

public class MyPageVerifyInterceptor implements HandlerInterceptor {
    // 로그인 이후, 내 정보 변경 전 비밀번호 인증 여부 확인

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler){
        // 브라우저가 보내는 OPTIONS 요청은 로그인 검사하지 말고 그냥 통과
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())){
            return true;
        }

        // 세션 꺼내오기
        HttpSession session = request.getSession(false);
        if(session == null){ //세션 없으면 막기
            throw new IllegalStateException(("로그인이 필요합니다."));
        }

        // 로그인 여부 체크
        Member loginMember = (Member)session.getAttribute("loginMember");
        if(loginMember== null){
            throw new IllegalStateException(("로그인이 필요합니다."));
        }

        // +) 마이페이지 내 정보수정 전 비밀번호 인증 여부 확인
        Long verifiedMemberId = (Long)session.getAttribute("mypageVerifiedMemberId");
        if(verifiedMemberId == null || !verifiedMemberId.equals(loginMember.getId())){ //로그인한 회원과 인증 통과한 회원 동일한지 체크
            throw new IllegalStateException("내 정보 변경을 위해 비밀번호 인증이 필요합니다.");
        }

        // 통과
        return true;
    }
}
