package demo.demo_spring.member.domain;

public enum Role {
    USER, ADMIN
}
/*  enum(열거형) : 관련있는 상수(변하지않는 값)들을 모아놓은 클래스
-> 선택지가 딱 정해져있는 값

String 안쓰고 enum 쓰는 이유 :
문자열 방식은 ADMIN, admin, admn같이 오타가 저장될 수 잇음.
자바는 이걸 다 다른 값으로 인식하여 나중에 문제가 생김
그에반해 enum방식은 미리 정의된 Role만 사용할 수 있으니깐,
오타가 나면 컴파일 시점에 바로 에러를 띄워줌. 그래서 훨씬 안전.
 */