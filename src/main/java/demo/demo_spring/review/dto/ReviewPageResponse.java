package demo.demo_spring.review.dto;

import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
public class ReviewPageResponse {
    // ReviewListResponse 여러개를 담을 페이지 응답용 DTO

    private ReviewSummaryResponse summary; // 리뷰 통계 (별점 평균, 리뷰 개수)
    private List<ReviewListResponse> reviews; // 현재 페이지에 실제로 보여줄 리뷰 목록 (카드로 들어갈 리뷰들)

    private int page; // 현재 페이지 번호 (백엔드에서는 보통 0부터 시작)
    private int size; // 한 페이지에 보여줄 개수

    private long totalElements; // 전체 리뷰 수
    private int totalPages; // 전체 페이지 수

    private boolean hasNext; // 다음 페이지 존재 여부
    private boolean hasPrevious; // 이전 페이지 존재 여부

    private ReviewPageResponse(ReviewSummaryResponse summary, List<ReviewListResponse> reviews,
                               Page<?> pageInfo) {
        // Page<?> pageInfo : 레포지토리에서 Pageable 조건으로 조회한 뒤 반환된 "페이지 결과 객체"
        // 실제 데이터 목록 + 페이지 정보(현재 페이지, 전체 개수, 전체 페이지 수 등등)를 함께 담고있음.

        // <?> -> 제네릭Generic으로, 무엇이든 담을 수 있다는 의미     ex) Page<Review>, Page<Product>
        // Page 안에 Review가 들어오든, Product가 들어오든, 여기서는 "어떤 타입인지는 중요하지 않고 Page 정보만" 쓰겠다

        // 왜 List가 아닌 Page인가?
        // 리뷰 목록은 페이지네이션이 필요한데,
        // 단순 List가 아닌, "현재 페이지의 데이터 + 전체 개수 + 전체 페이지 수"를 함께 담는 Page를 사용함.
        // 그래야지 프론트에서 페이지 버튼 만들 수 있음.

        this.summary = summary;
        this.reviews = reviews;
        this.page = pageInfo.getNumber();
        this.size = pageInfo.getSize();
        this.totalElements = pageInfo.getTotalElements();
        this.totalPages = pageInfo.getTotalPages();
        this.hasNext = pageInfo.hasNext();
        this.hasPrevious = pageInfo.hasPrevious();
    }

    public static ReviewPageResponse of(ReviewSummaryResponse summary, List<ReviewListResponse> reviews,
                                        Page<?> pageInfo) {
        return new ReviewPageResponse(summary, reviews, pageInfo);
    }

}

/* 주문 상세와는 성격와는 성격이 다른 경우.
주문 상세에서는 주문 1건 마다 그 안에 주문 상품이 여러개로, 주문 하나를 상세하게 보여주는 것이 목적이었음.
그래서 루트가 OrderDetailResponse 안에 List<OrderItemResponse>가 들어가면 끝이었음.
또한 단건 조회에다가 페이지네이션, 정렬, 필터 등등이 없어 OrderPageResponse같은게 필요하지 않음.

그러나 리뷰는 리뷰 하나 상세를 보여주는게 아니라, 리뷰 목록 전체를 보여주려함.
그리고 그 안에는
리뷰 여러개, 현재 페이지 번호, 전체 페이지 수, 전체 리뷰 수, 정렬 기준, 별점 필터 등등이 있음.
고로 단순히 List<ReviewListResponse>만 내려주면 부족하게 됨. 목록 자체에 대한 정보가 필요함.

그래서 구조가
ReviewPageResponse
 ├─ reviews: List<ReviewListResponse>
 ├─ page
 ├─ size
 ├─ totalElements
 ├─ totalPages
 ├─ hasNext
 └─ hasPrevious
 이렇게 되는 것임.
 */

/*
페이지네이션 (기술/방식 이름) :
    많은 데이터를 한 번에 다 보여주지 않고, 여러 페이지로 나누어 보여주는 방식.

Pageable (조회 조건) :
    페이지네이션 조회를 하기 위한 조회 조건 객체.
    몇 페이지를, 몇 개씩, 어떤 정렬 기준으로 가져올지 같은 정보를 담음.
    컨트롤러에서 이 객체를 받아 레포지토리(db)에 넣어서 조회함.

Page (조회 결과) :
    Pageable 조건으로 조회한 결과 객체
    단순히 현재 페이지의 데이터만 있는게 아니라, 전체 개수, 전체페이지 수, 다음/이전 페이지 존재 여부 같은 메타정보도 함께 담고있음.
 */