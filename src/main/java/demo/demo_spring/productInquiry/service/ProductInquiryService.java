package demo.demo_spring.productInquiry.service;

import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.domain.Role;
import demo.demo_spring.member.service.MemberService;
import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.repository.ProductRepository;
import demo.demo_spring.product.service.ProductService;
import demo.demo_spring.productInquiry.domain.ProductInquiry;
import demo.demo_spring.productInquiry.dto.AdminProductInquiryAnswerRequest;
import demo.demo_spring.productInquiry.dto.ProductInquiryCreateRequest;
import demo.demo_spring.productInquiry.dto.ProductInquiryUpdateRequest;
import demo.demo_spring.productInquiry.repository.ProductInquiryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional // ------> 나중에 읽기 트랜잭션, 쓰기 트랜잭션 리팩토링 가능성 생각하기.
public class ProductInquiryService {
    private final ProductInquiryRepository productInquiryRepository;
    private final MemberService memberService;
    private final ProductRepository productRepository;

    public ProductInquiryService(ProductInquiryRepository productInquiryRepository, MemberService memberService, ProductService productService, ProductRepository productRepository){
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
                = ProductInquiry.createInquiry(member, product,request.getTitle(),request.getContent());

        //저장 및 문의 id 반환
        ProductInquiry savedInquiry = productInquiryRepository.save(productInquiry);
        return savedInquiry.getId();
    }

    // 회원 문의글 수정 메서드
    public void update(Long inquiryId,  Long memberId, ProductInquiryUpdateRequest request){
        ProductInquiry productInquiry = productInquiryRepository.findById(inquiryId)
                .orElseThrow(()-> new IllegalStateException("수정하려는 문의글이 없습니다."));

        //문의자 본인 확인
        if(!memberId.equals(productInquiry.getMember().getId())){
            throw new IllegalStateException("문의자 본인이 아닙니다.");
        }

        //업데이트 메서드 호출(update()에서 상태검사 실시)
        productInquiry.updateInquiry(request.getTitle(), request.getContent());
    }

    // 관리자 답글 메서드
    public void adminAnswer(Long inquiryId, Long memberId, AdminProductInquiryAnswerRequest request){
        ProductInquiry productInquiry = productInquiryRepository.findById(inquiryId)
                .orElseThrow(()-> new IllegalStateException("답변하시려는 문의글이 없습니다."));

        //관리자인지 확인
        if (memberService.getMember(memberId).getRole() != Role.ADMIN){
           throw new IllegalStateException("답글을 작성할 관리자 권한이 없습니다.");
        }

        //답변 날짜
        LocalDateTime now = LocalDateTime.now();

        //답글 메서드 호출(answer()에서 상태검사 실시)
        productInquiry.answer(request.getAnswerContent(),now);
    }

    // 문의글 전체 조회
    // 문의글 상세 조회

}
