package demo.demo_spring.dto;

public class MemberLoginRequest { // ----> 로그인 요청용 객체

    //로그인할떄 받을 회원 name
    private String name;

    //getter and setter
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
/* 로그인은 단순한 "조회" -> Entity변환이 필요없다는데,
그럼 그냥 Member클래스를 그대로 사용하면 되지 않나 궁금했음.

찾아보니 가능은 한데 좋은 설계가 아니라서 구분을 해준다는 것 같음.
 +@ 1. 데이터 불일치 : 필요한 정보가 다름
    나중에가면 회원Member에 id,name뿐 아니라
    이메일, 비밀번호, 주소, 가입일 등등 더 많은 정보를 추가할텐데,
    로그인요청(LoginRequest)에서는 오직 id, 비밀번호를 요구할테니, 필요한 정보가 일치하지 않게 됨
    만약 Member객체로 로그인을 받으면, 나머지 이름, 주소 같은 필드들이 null인 상태로 돌아다니게 되니,
    코드가 지저분해지고 "이 객체에 데이터가 다 들어있는게 맞나?"하는 혼란을 주게 되는 문제가 생김.

    2. 보안상의 위험 -> 노출하면 안되는 정보
    Member객체는 DB구조를 그대로 보여주는데,
    만약 Member객체를 컨트롤러에서 직접 노출하거나 받으면, 해커가 API스펙을 보고 내부 구조를 쉽게 파악할 위험.
    (-> 그래서 DTO!!!! 딱 필요한 데이터만 골라 담아서 전달하니까 내부 DB설계 꽁꽁 숨김!!!)

    3. 유효성 검사(Validation)의 분리
    회원가입할 때의 규칙과 로그인할 때 규칙이 다를 수 있음.
    join : 이메일 형식 체크, 비밀번호 규칙, 이름 필수 등 체크할게 많음
    login : id, password가 비어있는지만 체크하면 됨
    -> @NotBlank 같은 체크용 어노테이션을 Member객체에 다 몰아 넣으면 코드가 복잡해지고 관리가 안됨!

    고로 Member객체와 Login용 객체를 분리!
    -> 그냥! Entity(Member)는 소중한 원본 데이터니까 컨트롤러까지 끌고 나오지 말고,
    입구(Controller)에서는 전용 배달원(DTO)을 써라! 라는 느낌.
 */
