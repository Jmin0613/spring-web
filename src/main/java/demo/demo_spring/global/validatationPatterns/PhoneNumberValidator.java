package demo.demo_spring.global.validatationPatterns;

public class PhoneNumberValidator {

    private PhoneNumberValidator(){
        // 상수만 모아둔 클래스.
        // 객체 생성 막아, 메모리 낭비 방지.
    }

    public static final String PHONE_NUMBER =
            "^01(?:0|1|[6-9])-(?:\\d{3}|\\d{4})-\\d{4}$";

    // 01 : 무조건 01로 시작
    // (?:0|1|[6-9]) : 그 다음 숫자는 0,1,6,7,8,9 중 하나여야 함
    // - : 하이픈 하나 들어가야함
    // (?:\d{3}|\d{4}) : 중간 번호는 숫자(\d) 3자리 또는 4자리여야 함
    // - : 하이폰 하나 들어가야함
    // \d{4}$ : 마지막은 무조건 숫자 4자리로 끝나야 함
}
