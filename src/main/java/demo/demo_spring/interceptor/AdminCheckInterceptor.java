package demo.demo_spring.interceptor;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.domain.Role;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.servlet.HandlerInterceptor;

public class AdminCheckInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        //1. 세션 꺼내기 + null체크
        HttpSession session = request.getSession(false);
        if(session==null){
            throw new IllegalStateException("로그인 필요");
        }

        //2. loginMember꺼내기 + null체크
        Member loginMember = (Member)session.getAttribute("loginMember");
        if(loginMember==null){
            throw new IllegalStateException("로그인 필요");
        }

        //3. loginMember.getRole() 확인
        if(loginMember.getRole()!= Role.ADMIN){
            throw new IllegalStateException("관리자 권한 없음"); //ADMIN 아니면 예외
        }
        return true;
    }
}