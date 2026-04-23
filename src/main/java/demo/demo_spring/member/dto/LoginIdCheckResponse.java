package demo.demo_spring.member.dto;

import lombok.Getter;

@Getter
public class LoginIdCheckResponse {

    private boolean available;
    private String message;

    private LoginIdCheckResponse(boolean available, String message){
        this.available = available; this.message = message;
    }

    public static LoginIdCheckResponse available(){
        return new LoginIdCheckResponse(true, "사용 가능한 아이디입니다.");
    }
    public static LoginIdCheckResponse unavailable(){
        return new LoginIdCheckResponse(false, "사용할 수 없는 아이디입니다.");
    }
}
