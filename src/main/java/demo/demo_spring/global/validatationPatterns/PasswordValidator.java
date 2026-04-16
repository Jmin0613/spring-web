package demo.demo_spring.global.validatationPatterns;

import java.util.regex.Pattern;

public final class PasswordValidator {

    private PasswordValidator() {
        // 상수만 모아둔 클래스라서, 메모리 낭비하며 객체 생성하는거 못하게 막아버리기.
        // 그냥 필요할때 가져다 쓰기.
    }

    public static final String PASSWORD =
            "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{12,}$";

    //(?=.*[A-Z]): 대문자가 한 글자 이상 포함되어야 함.
    //(?=.*[0-9]): 숫자가 포함되어야 함.
    //(?=.*[a-z]): 소문자가 포함되어야 함.
    //(?=.*[!@#$%^&*()-+=]): 특수문자가 포함되어야 함.
    //.{8,}$: 최소 12자 이상이어야 함.

}
