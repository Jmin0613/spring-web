package demo.demo_spring.global.config;

import demo.demo_spring.global.interceptor.AdminCheckInterceptor;
import demo.demo_spring.global.interceptor.LoginCheckInterceptor;
import demo.demo_spring.global.interceptor.MyPageVerifyInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    //스프링 mvc에 인터셉트 등록하는 클래스

    @Override
    public void addInterceptors(InterceptorRegistry registry){
        //1-1. 로그인 체크 인터셉터 등록
        registry.addInterceptor(new LoginCheckInterceptor())
                .order(1) //인터셉터 실행 순서
                .addPathPatterns("/hotdeals/*/buy", "/products/*/buy", "/hotdeals/*/alerts/**",
                        "/orders/**", "/wishlist", "/cart-items/buy", "notification/**")
                .excludePathPatterns("/test/**"); //k6 test
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

    // 프론트엔드 API 호출과 쿠키 기반 요청을 허용하기 위한 CORS 설정
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    // 서버에 저장된 업로드 이미지를 URL로 접근할 수 있도록 정적 리소스 경로 매핑
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadPath = Paths.get("uploads", "images")
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();

        registry.addResourceHandler("/uploads/images/**")
                .addResourceLocations(uploadPath);
    }
}
