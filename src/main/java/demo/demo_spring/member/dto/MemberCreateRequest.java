package demo.demo_spring.member.dto;

import demo.demo_spring.member.domain.Member;

public class MemberCreateRequest {
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

    //Entity 변환 -> member로 넘겨주기
    public Member toEntity() {
        Member member = new Member();
        member.setName(this.name);
        return member;
    }
}
/*
클라이언트 -> DTO(데이터 담기) -> Entity로 변환 -> Service -> Repository -> DB저장

이 표를 보고 궁금했던 것 : Entity(Nember)는 domain인데 왜 Service로 보내라는거지?
-> domain : 비즈니스 핵심 객체 (Entirry)
-> service : 비즈니스 로직 수행하는 계층

domain의 경우, 그냥 "데이터+객체"로, DB랑 연결된 객체일뿐 로직이 거의 없음.
반면 Service는 중복검사, 저장, 비즈니스 로직 등을 수행.

그래서 흐름이
DTO -> Entity(Member 생성)
               -> Service(로직 수행)
               -> Repository (DB 저장)
이렇게 되는 것임. DTO로 받은 데이터를 Entity로 변환하고,
Service에서 비즈니스 로직을 수행한 뒤 Repository를 통해 DB에 저장하는 것.

그럼 왜 domain으로 안갔나? -> 사실은 이미 가있는 상태임.
Member member = request.toEntity();를 한 순간 이미 domain 객체가 생성 완료됨.
근데 domain은 실행하는 애가 아니고 사용되는 객체라서 그 다음 단계인 Service로 넘기는 거임.

 */
