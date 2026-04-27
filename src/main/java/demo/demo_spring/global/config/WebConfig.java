package demo.demo_spring.global.config;

import demo.demo_spring.global.interceptor.AdminCheckInterceptor;
import demo.demo_spring.global.interceptor.LoginCheckInterceptor;
import demo.demo_spring.global.interceptor.MyPageVerifyInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration // 스프링에게 설정 클래스로 알려주기
public class WebConfig implements WebMvcConfigurer {
    //스프링 mvc에 인터셉트 등록하는 클래스

    @Override
    public void addInterceptors(InterceptorRegistry registry){
        //InterceptorRegistry -> 인터셉터를 등록해두는 목록/관리자
        // 우리가 인터셉터를 스프링mvc에 추가하고, 어떤 url에 붙일지 정하고, 순서를 정하게 해주는 도구임.

        //1-1. 로그인 체크 인터셉터 등록
        registry.addInterceptor(new LoginCheckInterceptor())
                .order(1) //인터셉터 실행 순서
                .addPathPatterns("/hotdeals/*/buy", "/products/*/buy",
                        "/orders/**", "/wishlist", "/cart-items/buy", "notification/**");
        // addPathPatterns() -> 적용할 경로
        // excludePathPatterns() -> 제외할 경로

        //1-2. 마이페이지 내 정보수정 전 비밀번호 인증 체크 인터셉터 등록
        registry.addInterceptor(new MyPageVerifyInterceptor())
                .order(2)
                .addPathPatterns(
                        "/mypage/edit-myinfo"
                );

        //2. 관리자 체크 인터셉터 등록
        registry.addInterceptor(new AdminCheckInterceptor())
                .order(2)
                .addPathPatterns("/admin/**");

    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
