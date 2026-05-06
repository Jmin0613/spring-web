package demo.demo_spring.k6.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Profile("k6")
@Service
@RequiredArgsConstructor
public class K6PaymentTestDataService {

    @PersistenceContext
    private EntityManager em;

    /*
        k6 결제 준비 테스트로 생성된 잔여 DB 데이터만 삭제.

        Redis 재고는 여기서 건드리지 않음.
        Redis 재고 세팅은 K6PaymentTestController의 redis-stock API에서 따로.

        삭제 대상:
        - delivery_memo = 'k6 테스트'인 주문과 그 하위 데이터

        삭제 순서 중요:
        review -> payment -> order_item -> orders

        이유:
        review가 order_item을 FK로 참조하므로
        order_item보다 review를 먼저 삭제.
     */
    @Transactional
    public Map<String, Object> clearPaymentPrepareTestData() {

        int deletedReviews = em.createNativeQuery("""
                DELETE r
                FROM review r
                JOIN order_item oi ON r.order_item_id = oi.id
                JOIN `orders` o ON oi.order_id = o.id
                WHERE o.delivery_memo = 'k6 테스트'
                """)
                .executeUpdate();

        int deletedPayments = em.createNativeQuery("""
                DELETE p
                FROM payment p
                JOIN `orders` o ON p.order_id = o.id
                WHERE o.delivery_memo = 'k6 테스트'
                """)
                .executeUpdate();

        int deletedOrderItems = em.createNativeQuery("""
                DELETE oi
                FROM order_item oi
                JOIN `orders` o ON oi.order_id = o.id
                WHERE o.delivery_memo = 'k6 테스트'
                """)
                .executeUpdate();

        int deletedOrders = em.createNativeQuery("""
                DELETE FROM `orders`
                WHERE delivery_memo = 'k6 테스트'
                """)
                .executeUpdate();

        return Map.of(
                "deletedReviews", deletedReviews,
                "deletedPayments", deletedPayments,
                "deletedOrderItems", deletedOrderItems,
                "deletedOrders", deletedOrders,
                "message", "k6 결제 준비 테스트 잔여 DB 데이터 삭제 완료"
        );
    }

    /*
        k6 테스트 데이터 확인용.
        Redis 재고는 기존 redis-stock 조회 API로 확인.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> countPaymentPrepareTestData() {

        Number reviewCount = (Number) em.createNativeQuery("""
                SELECT COUNT(*)
                FROM review r
                JOIN order_item oi ON r.order_item_id = oi.id
                JOIN `orders` o ON oi.order_id = o.id
                WHERE o.delivery_memo = 'k6 테스트'
                """)
                .getSingleResult();

        Number paymentCount = (Number) em.createNativeQuery("""
                SELECT COUNT(*)
                FROM payment p
                JOIN `orders` o ON p.order_id = o.id
                WHERE o.delivery_memo = 'k6 테스트'
                """)
                .getSingleResult();

        Number orderItemCount = (Number) em.createNativeQuery("""
                SELECT COUNT(*)
                FROM order_item oi
                JOIN `orders` o ON oi.order_id = o.id
                WHERE o.delivery_memo = 'k6 테스트'
                """)
                .getSingleResult();

        Number orderCount = (Number) em.createNativeQuery("""
                SELECT COUNT(*)
                FROM `orders`
                WHERE delivery_memo = 'k6 테스트'
                """)
                .getSingleResult();

        return Map.of(
                "reviewCount", reviewCount.longValue(),
                "paymentCount", paymentCount.longValue(),
                "orderItemCount", orderItemCount.longValue(),
                "orderCount", orderCount.longValue()
        );
    }
}