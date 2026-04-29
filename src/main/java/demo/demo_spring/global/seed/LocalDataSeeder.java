package demo.demo_spring.global.seed;

import demo.demo_spring.hotdeal.domain.HotDeal;
import demo.demo_spring.hotdeal.repository.HotDealRepository;
import demo.demo_spring.member.domain.Member;
import demo.demo_spring.member.repository.MemberRepository;
import demo.demo_spring.notice.domain.Notice;
import demo.demo_spring.notice.repository.NoticeRepository;
import demo.demo_spring.notification.repository.NotificationRepository;
import demo.demo_spring.product.domain.Product;
import demo.demo_spring.product.domain.ProductCategory;
import demo.demo_spring.product.domain.ProductStatus;
import demo.demo_spring.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Profile("local") // local에서만 작동하도록
@Component // 스프링이 관리하도록
@RequiredArgsConstructor //필요한 도구 자동으로 가져오도록
public class LocalDataSeeder implements CommandLineRunner {
    // local 시연 데이터 생성기

    private final MemberRepository memberRepository;
    private final ProductRepository productRepository;
    private final HotDealRepository hotDealRepository;
    private final NoticeRepository noticeRepository;

    @Override
    @Transactional
    public void run(String... args){ //가볍인자 -> 파라미터의 개수를 정해두지 않고 자유롭게 넘길 수 있음
        // 앱 실행할 때마다 seed 들어가면 unique제약 때문에 터지거나 데이터가 중복됨.
        // admin 생성 유무로 체크해주기.
        if(memberRepository.existsByLoginId("admin")){ // 만약 "admin"이라는 로그인 id가 존재하면
            return; //통과
        }

        seedMembers();
        List<Product> products = seedProducts();
        seedHotDeals(products);
        seedNotices();
    }

    // 관리자, 회원 게정 생성
    public void seedMembers(){
        // 관리자 계정 생성.
        Member admin = Member.createMember(
                "admin", "AdminPassword1234!", "admin@test.com",
                "관리자", "관리자", "010-0000-0000"
        );
        admin.promoteToAdmin();

        // 회원 계정 생성.
        Member user = Member.createMember(
                "user1", "UserPassword1234!", "user1@test.com",
                "회원1", "회원1호", "010-1111-1111"
        );

        // 생성 계정 저장.
        memberRepository.save(admin);
        memberRepository.save(user);
    }

    // 상품 5개 생성
    private List<Product> seedProducts(){
        // 일괄 저장을 위해 List로 만들기.
        List<Product> products = List.of(
                Product.createProduct(
                        "무선 블루투스 이어폰",
                        "가볍고 휴대하기 좋은 데일리 무선 이어폰입니다.",
                        "https://picsum.photos/seed/earphone/600/600",
                        "https://picsum.photos/seed/earphone/400/1200",
                        59000,
                        100,
                        ProductCategory.ELECTRONICS,
                        ProductStatus.ON_SALE
                ),
                Product.createProduct(
                        "기계식 키보드",
                        "타건감이 좋은 입문용 기계식 키보드입니다.",
                        "https://picsum.photos/seed/keyboard/600/600",
                        "https://picsum.photos/seed/keyboard/400/1200",
                        89000,
                        80,
                        ProductCategory.ELECTRONICS,
                        ProductStatus.ON_SALE
                ),
                Product.createProduct(
                        "대용량 보조배터리",
                        "여행과 출퇴근에 유용한 대용량 보조배터리입니다.",
                        "https://picsum.photos/seed/battery/600/600",
                        "https://picsum.photos/seed/battery/400/1200",
                        39000,
                        120,
                        ProductCategory.ELECTRONICS,
                        ProductStatus.ON_SALE
                ),
                Product.createProduct(
                        "데일리 백팩",
                        "노트북 수납이 가능한 심플한 데일리 백팩입니다.",
                        "https://picsum.photos/seed/backpack/600/600",
                        "https://picsum.photos/seed/backpack/400/1200",
                        69000,
                        70,
                        ProductCategory.FASHION,
                        ProductStatus.ON_SALE
                ),
                Product.createProduct(
                        "스테인리스 텀블러",
                        "보온과 보냉이 가능한 실용적인 텀블러입니다.",
                        "https://picsum.photos/seed/tumbler/600/600",
                        "https://picsum.photos/seed/tumbler/400/1200",
                        24000,
                        150,
                        ProductCategory.LIFE,
                        ProductStatus.ON_SALE
                )
        );
        // 생성한 상품들 일괄 저장
        return productRepository.saveAll(products);
        // 다음에 실행될 seedHotDeals 메서드가 상품 데이터를 사용할 수 있게 return
    }

    // 핫딜 3개 만들기
    private void seedHotDeals(List<Product> products){
        LocalDateTime now = LocalDateTime.now();

        // 앱 실행 직후 테스트용
        HotDeal hotDeal1 = HotDeal.createHotDeal(
                products.get(0),
                39000,
                20,
                now.plusSeconds(10), //start time
                now.plusDays(3), //end time
                now
        );

        // 예약 핫딜 확인용
        HotDeal hotDeal2 = HotDeal.createHotDeal(
                products.get(1),
                69000,
                15,
                now.plusMinutes(10),
                now.plusDays(2),
                now
        );

        // 나중에 시작하는 핫딜 확인용
        HotDeal hotDeal3 = HotDeal.createHotDeal(
                products.get(2),
                29000,
                30,
                now.plusHours(1),
                now.plusDays(1),
                now
        );

        // 생성한 핫딜들 저장
        hotDealRepository.saveAll(List.of(hotDeal1, hotDeal2, hotDeal3));
    }

    // 공지 3개 작성
    private void seedNotices(){
        List<Notice> notices = List.of(
                Notice.createNotice(
                        "시연용 쇼핑몰 안내",
                        "본 사이트는 온라인 쇼핑몰 실시간 핫딜 포트폴리오 프로젝트입니다."
                ),
                Notice.createNotice(
                        "핫딜 구매 안내",
                        "핫딜 상품은 한정 수량으로 판매되며 재고 소진 시 자동 품절 처리됩니다."
                ),
                Notice.createNotice(
                        "이미지 업로드 기능 안내",
                        "관리자는 상품 등록 시 대표 이미지와 상세 이미지를 업로드할 수 있습니다."
                )
        );

        noticeRepository.saveAll(notices);
    }
}
