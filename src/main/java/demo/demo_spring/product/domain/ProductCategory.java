package demo.demo_spring.product.domain;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Arrays;

public enum ProductCategory {
    // 카테고리 - 라벨 저장
    FOOD("식품"),
    LIFE("생활"),
    ELECTRONICS("가전"),
    BEAUTY("뷰티"),
    FASHION("패션"),
    BOOK("도서");

    private final String label;

    ProductCategory(String label){
        this.label = label;
    }

    public String getLabel(){
        return label;
    }

    @JsonCreator // 역직렬화 위해 사용 (프론트 "식품" -> 백 "FOOD")
    public static ProductCategory from(String value){
        // 값 비어있는지, 공백만있는지 검사
        if (value == null || value.isBlank()){
            throw new IllegalStateException("카테고리를 입력해주세요.");
        }

        return Arrays.stream(values()) //Enum 하나씩 꺼내기
                .filter(category ->
                        category.name().equalsIgnoreCase(value) //이름 같은지 검사
                                || category.label.equals(value) //또는 라벨과 일치하는지 검사
                )
                .findFirst()
                .orElseThrow(()-> new IllegalStateException("존재하지 않는 카테고리입니다."));
    }
}
