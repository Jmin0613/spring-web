package demo.demo_spring.dto;

public class MemberRequestDto {
    //회원가입 만들떄 필요한 데이터?
    //id, name
    //그중 외부에서 받아야 하는것 : name

    // private long id; -> 서버가 주는 것
    private String name; //사용자(외부)에게 받는 것

    // name만 getter/setter
    public String getName(){
        return name;
    }

    public void setName(String name){
        this.name = name;
    }
}
