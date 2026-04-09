package demo.demo_spring.productInquiry.service;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.domain.Role;
import demo.demo_spring.member.repository.MemberRepository;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.repository.ProductRepository;
import demo.demo_spring.product.service.ProductService;
import demo.demo_spring.productInquiry.domain.ProductInquiry;
import demo.demo_spring.productInquiry.dto.*;
import demo.demo_spring.productInquiry.repository.ProductInquiryRepository;
import demo.demo_spring.review.domain.Review;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional // ------> 나중에 읽기 트랜잭션, 쓰기 트랜잭션 리팩토링 가능성 생각하기.
public class ProductInquiryService {
    private final ProductInquiryRepository productInquiryRepository;
    private final MemberService memberService;
    private final ProductRepository productRepository;

    public ProductInquiryService(ProductInquiryRepository productInquiryRepository, MemberService memberService, ProductService productService, ProductRepository productRepository, MemberRepository memberRepository){
        this.productInquiryRepository = productInquiryRepository;
        this.memberService = memberService;
        this.productRepository = productRepository;
    }

    // 회원 문의 작성
    public Long create(Long productId, Long memberId, ProductInquiryCreateRequest request){
        Member member = memberService.getMember(memberId); //서비스에서 객체로 바로 꺼내올수잇음
        Product product = productRepository.findById(productId) //서비스에서 DTO로 가져와서, 레포지토리로 접근해서 꺼내옴
                .orElseThrow(()-> new IllegalStateException("문의하려는 상품이 없습니다."));

        ProductInquiry productInquiry
                = ProductInquiry.createInquiry(member, product,request.getTitle(),request.getContent(), request.isSecret());

        //저장 및 문의 id 반환
        ProductInquiry savedInquiry = productInquiryRepository.save(productInquiry);
        return savedInquiry.getId();
    }

    // 회원 문의글 수정 메서드
    public void update(Long productId, Long inquiryId, Long memberId,
                       ProductInquiryUpdateRequest request){
        ProductInquiry productInquiry = productInquiryRepository.findById(inquiryId)
                .orElseThrow(()-> new IllegalStateException("수정하려는 문의글이 없습니다."));

        // ProductId와 InquiryId 관계 검증
        validateInquiryBelongToProduct(productInquiry, productId);

        // 작성자 본인 확인
        validateWriter(memberId, productInquiry);

        // 업데이트 메서드 호출(update()에서 상태검사 실시)
        productInquiry.updateInquiry(request.getTitle(), request.getContent());
    }

    // 회원 문의글 삭제 메서드
    public void delete(Long productId, Long inquiryId, Long memberId){
        // 문의글 존재 여부 확인
        ProductInquiry productInquiry = productInquiryRepository.findById(inquiryId)
                .orElseThrow(()-> new IllegalStateException("삭제하려는 문의가 없습니다."));

        // ProductId와 InquiryId 관계 검증
        validateInquiryBelongToProduct(productInquiry, productId);

        // 작성자 본인 확인
        validateWriter(memberId, productInquiry);

        // 상태확인 -> waiting 상태만 삭제가능(관리자 답변 전까지)
        productInquiry.validateWaitingStatus();
        productInquiryRepository.delete(productInquiry);
    }

    // 관리자 답글 메서드
    public void adminAnswer(Long productId, Long inquiryId, Long memberId,
                            AdminProductInquiryAnswerRequest request){
        ProductInquiry productInquiry = productInquiryRepository.findById(inquiryId)
                .orElseThrow(()-> new IllegalStateException("답변하시려는 문의글이 없습니다."));

        // ProductId와 InquiryId 관계 검증
        validateInquiryBelongToProduct(productInquiry, productId);

        //관리자인지 확인
        if (memberService.getMember(memberId).getRole() != Role.ADMIN){
           throw new IllegalStateException("답글을 작성할 관리자 권한이 없습니다.");
        }

        //답변 날짜
        LocalDateTime now = LocalDateTime.now();

        //답글 메서드 호출(answer()에서 상태검사 실시)
        productInquiry.answer(request.getAnswerContent(),now);
    }

    // 상품별 문의 목록 조회
    public List<ProductInquiryListResponse> findAllInquiresByProduct(Long productId){
        productRepository.findById(productId)
                .orElseThrow(()-> new IllegalStateException("문의 목록을 조회하려는 상품이 없습니다."));

        return productInquiryRepository.findAllByProductIdOrderByCreatedAtDesc(productId)
                .stream()
                .map(ProductInquiryListResponse::fromEntity)
                .toList();
    }

    // 문의 단건 상세 조회 + 비밀글 -> 가드 클로즈 활용
    public ProductInquiryDetailResponse findInquiry(Long productId, Long inquiryId, Long memberId){
        // 문의글 존재 여부 판단
        ProductInquiry productInquiry = productInquiryRepository.findById(inquiryId)
                .orElseThrow(()-> new IllegalStateException("조회하려는 문의가 없습니다."));

        // ProductId와 InquiryId 관계 검증
        validateInquiryBelongToProduct(productInquiry, productId);

        // 비밀글 여부 판단
        if(productInquiry.isSecret()){ //true -> 비밀글
            // 비밀글의 경우 권한 확인
            if(memberId == null){
                throw new IllegalStateException("로그인이 필요합니다.");
            }

            Member loginMember = memberService.getMember(memberId);

            // 권한이 없는 부정조건으로 체크
            if(loginMember.getRole()!=Role.ADMIN // 관리자도 아님
                    && !loginMember.getId().equals(productInquiry.getMember().getId())){ // 작성자 본인도 아님
                throw new IllegalStateException("문의 연람 권한이 없습니다.");
            }
        }
        // 공개글이면 열람 + 권한있으면 열람
        return ProductInquiryDetailResponse.fromEntity(productInquiry);
    }

    // ProductId와 InquiryId 관계 검증 메서드
    private void validateInquiryBelongToProduct(ProductInquiry productInquiry, Long productId){
        if(!productInquiry.getProduct().getId().equals(productId)){
            throw new IllegalStateException("해당 상품에 대한 문의가 아닙니다.");
        }
    }

    // 작성자 본인 확인 메서드
    private void validateWriter(Long memberId, ProductInquiry productInquiry){
        if(!memberId.equals(productInquiry.getMember().getId())){
            throw new IllegalStateException("문의 작성자 본인이 아닙니다.");
        }
    }

}
