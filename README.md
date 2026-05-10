# 🔥 WAT% - 온라인 핫딜 쇼핑몰 🔥

## 1. 프로젝트 개요
- 프로잭트 명 : WAT - We Are always hoT
- 진행 기간 : 7주 (2026.03.18. ~ 2026.5.06) - 개인, 백엔드 중심 구현
- 목표 : Spring Boot와 Redis를 활용한 핫딜 쇼핑몰 웹 사이트 개발
- 모델링한 사이트 : 쿠팡, 톡딜

WAT은 일반 상품 구매와 핫딜 상품 구매를 분리하여, 각 구매 상황에 맞는 재고 정합성 처리 방식을 적용한 온라인 쇼핑몰 프로젝트입니다.
일반 상품 구매에는 MySQL Pessimistic Lock을 적용하고, 핫딜 상품 구매에는 Redis Lua Script 기반 재고 선점 방식을 적용하여 
동시 구매 상황에서 발생할 수 있는 초과 판매 문제를 방지하는 것을 목표로 했습니다.

## 2. 기술 스택
### Backend / Database / Infra :
- Java version "25.0.2" 2026-01-20 LTS
- Spring Boot
- MySQL
- Redis
- RabbitMQ
- PortOne
- Docker

### Test / Performance
- k6
- HikariCP

### Frontend (ai 활용)
- React
- TypeScript
- Vite

## 3. 핵심 기능 및 특징
- 일반상품 구매 : MySQL Pessimistic Lock 기반 재고 차감
- 핫딜상품 구매 : Redis Lua Script 기반 재고 선점
- 핫딜 시작 알림 : RabbitMQ 기반 비동기 메시징
- 성능 검증 : k6 기반 테스트 및 HikariCP 튜닝

<details>
  <summary>핵심 기능 설명 펼치기</summary>
  
  #### 1. 일반상품 구매 : 
  일반 상품 구매는 MySQL Pessimistic Lock을 사용하여 재고 정합성을 보장했습니다.
  구매 요청이 들어오면 상품 row에 lock을 걸고, 현재 재고와 상품 상태를 확인한 뒤 주문 데이터를 생성합니다.

  📌 코드 확인: [ProductService](src/main/java/demo/demo_spring/product/service/ProductService.java), 
  [OrderService](src/main/java/demo/demo_spring/order/service/OrderService.java), 
  [PaymentService](src/main/java/demo/demo_spring/payment/service/PaymentService.java)

  #### 2. 핫딜상품 구매 :
  핫딜 상품 구매는 Redis Lua Script를 사용하여 재고를 선점하였습니다. 
  Redis 재고 선점에 성공한 경우에만 Orders / OrderItem / Payment 데이터를 생성하고,
  재고 선점에 실패하면 주문 데이터는 생성하지 않고 실패 응답을 반환합니다. 

  📌 코드 확인: [HotDealService](src/main/java/demo/demo_spring/hotdeal/service/HotDealService.java), 
  [HotDealRedisStockService](src/main/java/demo/demo_spring/hotdeal/service/HotDealRedisStockService.java), 
  [PaymentService](src/main/java/demo/demo_spring/payment/service/PaymentService.java)

  #### 3. 핫딜 시작 알림 :
  핫딜 시작 알림은 RabbitMQ를 이용해서 비동기적으로 처리했습니다.
  알림 발행 로직과 알림 저장 로직을 분리하여, 알림 처리 지연이 주요 요청 흐름에 영향을 주지 않는 구조로 구현했습니다.

  📌 코드 확인: [NotificationService](src/main/java/demo/demo_spring/notification/service/NotificationService.java), 
  [HotDealService](src/main/java/demo/demo_spring/hotdeal/service/HotDealService.java)
</details>

## 4. 기술적 의사결정
### (1) Redis Lua Script를 사용한 이유
핫딜 상품은 짧은 시간에 많은 구매 요청이 동시에 몰립니다.
이때 재고 조회와 검증, 차감이 분리되어 있으면, 동시에 여러 요청이 같은 재고를 보고 구매에 성공하는 "초과 판매 문제"가 발생할 수 있습니다.

그래서 이를 해결하기 위해 Redis Lua Script를 사용했습니다.
Lua Script를 이용하면 Redis 내부에서 조회/검증/차감 일련의 과정들을 원자적으로 실행하고 처리할 수 있기 때문입니다.

핫딜 구매에서 원자적으로 처리되는 과정들 :
1. Redis에 저장된 핫딜 재고 조회
2. 요청 수량만큼 구매 가능한지 검증
3. 가능하면 재고 차감
4. 불가능하면 실패 반환

### (2) 일반 상품 구매에 Pessimistic Lock을 사용한 이유
일반 상품 구매는 핫딜처럼 매우 짧은 시간에 대량의 구매 요청이 집중되기보다는, 상품 재고를 데이터베이스 기준으로 안정적으로 관리하는 것이 중요하다고 판단하였습니다.
따라서 일반 상품 구매에서는 MySQL의 Pessimistic Lock을 사용하여 상품 row를 잠근 뒤, 재고를 차감하도록 구현했습니다.
이를 통해 동시에 여러 사용자가 같은 상품을 구매하더라도, 하나의 트랜잭션이 재고를 변경하는 동안 다른 트랜잭션은 대기하게 되어 재고 정합성을 보장할 수 있습니다.

### (3) RabbitMQ를 사용한 이유
핫딜 시작 알림 기능은 사용자의 구매 요청 흐름과 직접적으로 연결될 필요가 없는 비동기 작업입니다.
알림 발송을 구매 로직 안에서 직접 처리하게 되면, 알림 처리 지연이 사용자 요청 응답시간에 영향을 줄 수 있습니다.
따라서 RabbitMQ를 사용하여 알림 발행과 처리를 분리하였습니다.

알림 발송 처리 구조 :
1. 스케줄러를 이용해 핫딜의 상태 변경 감지
2. 핫딜 시작 알림 메세지 발행
3. RabbitMQ Queue에 메세지 적재
4. Consumer가 메세지를 소비하여 알림을 생성

### (4) k6 전용 테스트 API를 만든 이유
실제 로그인 흐름을 포함하여 성능 테스트를 진행하면, 결제 준비 API 자체의 병목이 아니라 로그인 또는 인증 처리 병목이 함께 측정될 수 있다 판단하였습니다.
따라서 k6 테스트에서는 운영 로그인 병목을 제거하고, 실제 결제 준비 로직만 측정하기 위해 k6 프로필 전용 테스트 컨트롤러를 만들었습니다.
테스트 API는 'memberId'를 직접 받아 'PaymentService.preparePayment()'를 호출하고, Redis 재고 선점과 Orders/OrderItem/Payment 저장 흐름을 실제로 수행합니다.

## 5. 그 외 주요 기능
#### 1. 회원가입 및 로그인
- 회원가입 시 비밀번호와 휴대폰 번호에 정규식 패턴 검증을 적용하여, 잘못된 형식의 입력값이 저장되지 않도록 제한했습니다.
- 로그인 성공 시, 세션에 사용자 정보를 저장하여 로그인 상태를 유지시켰습니다.
- 관리자 기능은 회원가입 단계에서 분리하지 않고, 로그인 이후 관리자 권한 확인을 통해 접근을 제한했습니다.

📌 코드 확인: [MemberService](src/main/java/demo/demo_spring/member/service/MemberService.java), 
[MemberController](src/main/java/demo/demo_spring/member/controller/MemberController.java)

#### 2. 사용자용 상품 조회
- 일반 상품과 핫딜 상품을 분리하여 조회할 수 있도록 구현했습니다.
- 일반 상품은 목록은 최신순을 기본값으로 제공하고, 구매순 정렬 옵션을 추가했습니다.

📌 코드 확인: [ProductService](src/main/java/demo/demo_spring/product/service/ProductService.java), 
[HotDealService](src/main/java/demo/demo_spring/hotdeal/service/HotDealService.java)

#### 3. 사용자용 장바구니/찜/리뷰/문의
- 장바구니는 로그인 회원의 세션 정보를 기준으로 상품담기, 수량 변경, 단건 삭제, 전체 삭제 기능을 구현했습니다.
- 장바구니에 이미 같은 상품이 있는 경우, 새 항목을 만들지 않고 기존 장바구니 항목의 수량을 증가시켰습니다.
- 장바구니 선택 구매 시, 선택한 항목이 로그인 회원의 장바구니에 속하는지 검하고, 상품ID를 정렬하여 데드락을 방지하였습니다.
- 찜기능은 토글 방식으로 구현하여, 이미 찜한 상품은 다시 요청하면 찜이 취소되고 상품의 찜 개수도 함께 갱신되도록 처리했습니다.
- 리뷰는 구매한 주문상품('OrderItem')에 대해서만 작성할 수 있도록 검증하고, 하나의 주문상품에 중복 리뷰가 작성되지 않도록 제한했습니다.
- 상품 문의는 작성자 본인만 수정/삭제할 수 있도록 검증하고, 비밀글은 작성자 또는 관리자만 상세조회할 수 있도록 권한을 분리했습니다.

📌 코드 확인: [CartService](src/main/java/demo/demo_spring/cart/service/CartService.java), 
[WishlistService](src/main/java/demo/demo_spring/wishlist/service/WishlistService.java), 
[ReviewService](src/main/java/demo/demo_spring/review/service/ReviewService.java), 
[ProductInquiryService](src/main/java/demo/demo_spring/productInquiry/service/ProductInquiryService.java)

#### 4. 관리자용 상품 및 핫딜 등록/수정/삭제
- 관리자는 일반상품을 등록/수정/삭제할 수 있으며, 상품 상태를 변경할 수 있도록 구현했습니다.
- 관리자는 핫딜을 등록/수정/삭제할수 있고, 삭제 시 남은 핫딜 재고를 원상품 재고로 반환하도록 처리했습니다.
- 핫딜 운영 중 문제가 발생할 경우를 대비해 긴급 중단(`STOPPED`)과 재개 기능을 추가하여, 운영자가 핫딜 상태를 직접 제어할 수 있도록 구현했습니다.

📌 코드 확인: [ProductService](src/main/java/demo/demo_spring/product/service/ProductService.java), 
[HotDealService](src/main/java/demo/demo_spring/hotdeal/service/HotDealService.java)

#### 5. 관리자용 문의 답변
- 문의 답변 등록 시 로그인 회원이 관리자 권한을 가진 사용자인지 검증하도록 처리했습니다.
- 이미 답변 완료된 문의에는 다시 답변할 수 없도록 `WAITING` 상태에서만 답변 등록이 가능하게 제한했습니다.
- 답변이 등록되면 문의 작성자에게 답변 완료 알림을 생성하여, 사용자 알림 흐름과 연결되도록 처리했습니다.

📌 코드 확인: [ProductInquiryService](src/main/java/demo/demo_spring/productInquiry/service/ProductInquiryService.java), 
[NotificationService](src/main/java/demo/demo_spring/notification/service/NotificationService.java)

#### 6. 관리자용 주문, 배송 관리
- 배송 상태는 `READY → IN_DELIVERY → DELIVERED` 순서로 변경되도록 제한하여, 잘못된 배송 상태 변경을 막았습니다.
- 같은 배송 상태로 변경 요청이 들어온 경우에는 중복 변경 없이 그대로 반환하도록 처리했습니다.

📌 코드 확인: [OrderService](src/main/java/demo/demo_spring/order/service/OrderService.java), 
[PaymentService](src/main/java/demo/demo_spring/payment/service/PaymentService.java)
  
## 6. 시스템 설계
### ERD
#### 핵심 주문/결제 ERD
![핵심 주문/결제 ERD](docs/erd/core-order-payment-erd.png)
<details>
<summary>상품/핫딜 ERD 보기</summary>

![상품/핫딜 ERD](docs/erd/product-hotdeal-erd.png)
</details>

<details>
<summary>사용자 기능 ERD 보기</summary>

![사용자 기능 ERD](docs/erd/user-activity.png)
</details>

### API 명세
> Swagger UI  `http://localhost:8080/swagger-ui.html` 
###### 로컬 실행 후 접속 가능한 주소입니다.

#### 도메인별 API 목록
<details>
<summary> 1. 회원 API</summary>

![member-controller](docs/swagger/member-controller.png)
</details>

<details>
<summary> 2. 상품 및 핫딜 조회 / 운영 관련 API</summary>

![product-controller](docs/swagger/product-controller.png)
![hotdeal-controller](docs/swagger/hotdeal-controller.png)
![notice-controller](docs/swagger/notice-controller.png)
</details>


<details>
<summary> 3. 주문 및 결제 관련 API</summary>

![payment-controller](docs/swagger/payment-controller.png)
![cart-controller](docs/swagger/cart-controller.png)
![admin-order-controller](docs/swagger/admin-order-controller.png)
</details>


<details>
<summary> 4. 사용자 기능 API</summary>

![wishlist-controller](docs/swagger/wishlist-controller.png)
![review-controller](docs/swagger/review-controller.png)
![product-inquiry-controller](docs/swagger/product-inquiry-controller.png)
![notification-controller](docs/swagger/notification-controller.png)
![mypage-controller](docs/swagger/mypage-controller.png)
</details>

<details>
<summary> 5. 관리자 기능 API</summary>

![admin-product-controller](docs/swagger/admin-product-controller.png)
![admin-hot-deal-controller](docs/swagger/admin-hot-deal-controller.png)
![admin-product-inquiry-controller](docs/swagger/admin-product-inquiry-controller.png)
![admin-notice-controller](docs/swagger/admin-notice-controller.png)
![admin-image-controller](docs/swagger/admin-image-controller.png)
</details>

<details>
<summary> 6. 성능 테스트 API</summary>

![k6-test-controller](docs/swagger/k-6-test-controller.png)
</details>

### 시퀀스 다이어그램
<details>
<summary> 1. 일반 상품 결제 준비</summary>

![product-payment-sequence](./docs/sequence/product-payment-sequence.png)
[product-payment-sequence.md](docs/sequence/product-payment-sequence.md)
</details>

<details>
<summary> 2. 핫딜 상품 결제 준비</summary>

![hotdeal-payment-sequence](./docs/sequence/hotdeal-payment-sequence.png)
[hotdeal-payment-sequence.md](docs/sequence/hotdeal-payment-sequence.md)
</details>

<details>
<summary> 3. 핫딜 시작 알림 흐름</summary>

![hotdeal-alert-sequence](./docs/sequence/hotdeal-alert-sequence.png)
[hotdeal-alert-sequence.md](docs/sequence/hotdeal-alert-sequence.md)
</details>

## 7. k6 성능 테스트 및 HikariCP 튜닝
< 테스트 목적 >
- 재고 선점 전략별 데이터 정합성 및 응답 시간 비교 (no-lock/pessimistic-lock/Redis-lua)
- 실제 결제 준비 API에서 DB 커넥션 풀 한계 확인 및 HikariCP 튜닝

재고 정합성 테스트에서는 한정된 재고보다 많은 요청을 보내 초과 판매가 발생하는지 확인했습니다.  
반면 HikariCP 테스트에서는 재고 부족 실패가 DB 병목 측정을 방해하지 않도록, 
요청 수만큼 충분한 재고를 세팅한 뒤 결제 준비 API의 처리 한계를 측정했습니다.

### (1) 재고 선점 전략 비교
핫딜처럼 짧은 시간에 많은 구매 요청이 몰리는 상황에서 재고 정합성을 보장하기 위해 다음 세 가지 전략을 비교했습니다.

| 재고 선점 전략         | 설명 |
|------------------|---|
| No Lock          | 별도 동시성 제어 없이 재고 조회 후 차감 |
| Pessimistic Lock | DB row lock을 사용하여 하나의 트랜잭션만 재고를 차감 |
| Redis Lua Script | Redis 내부에서 재고 조회, 검증, 차감을 원자적으로 처리 |

#### 테스트 조건

| 항목 | 값 |
|---|---|
| 초기 재고 | 100 |
| VUS | 100 |
| 요청 수 | 300 |
| 기대 결과 | 성공 100건, 재고 부족 실패 200건 |

#### 테스트 결과

<details>
<summary>No Lock 결과 보기</summary>

![stock-test-no-lock](docs/k6/stock-test/stock-test-no-lock.png)
</details>

<details>
<summary>Pessimistic Lock 결과 보기</summary>

![stock-test-no-lock](docs/k6/stock-test/stock-test-pessimistic-lock.png)
</details>

<details>
<summary>Redis Lua 결과 보기</summary>

![stock-test-no-lock](docs/k6/stock-test/stock-test-redis-lua.png)
</details>

| 구분 | No Lock | Pessimistic Lock | Redis Lua Script |
|---|---|---|---|
| 성공 | 300 | 100 | 100 |
| 실패 | 0 | 200 | 200 |
| p95 응답 시간 | 251.24ms | 257.04ms | 21ms |
| 처리 속도 TPS | 348.89 req/s | 654.33 req/s | 1623.51 req/s |
| 병목 양상 | 서버 / DB 부하 | DB Lock 대기 | 병목 없음 |
| 결과 | 재고 초과 선점 발생 | 정합성 보장, DB Lock 대기 발생 | 정합성 보장, 가장 낮은 응답 시간 |

#### 결과 분석 및 전략 채택

No Lock은 응답 자체는 빠르게 보였지만, 재고가 100개인데 요청 300건이 모두 성공하여 초과 판매가 발생하였습니다.

Pessimistic Lock은 재고 정합성은 보장했지만, DB row lock 대기시간이 발생하였습니다.

Redis Lua Script은 Redis 내부에서 재고 조회/검증/차감을 원자적으로 처리하여 재고 정합성을 보장하면서도 가장 낮은 응답 시간을 보였습니다.

따라서 짧은 시간에 대량의 요청이 몰리는 핫딜 재고 선점 전략으로 Redis Lua Script가 적절하다는 것을 검증하였습니다.

Pessimistic Lock은 대기 시간이 발생하여 이런 대규모 트래픽에는 부적합하지만, 
데이터 무결성이 보장되는 것이 큰 강점으로, 상대적으로 트래픽이 적은 일반 결제 로직에 적합하다 판단하였습니다.

No Lock은 갱신 분실 현상같은 정합성 파괴 위험으로 인해 실제 서비스 적용에서 배제되어야 한다 판단했하였습니다.

### (2) 결제 준비 API 부하 테스트
결제 준비 API는 단순 재고 차감만 하지않고, 재고 선점 이후 `Orders`, `OrderItem`, `Payment` 데이터를 생성합니다.  
따라서 이 테스트에서는 핫딜 구매 흐름에서 DB 커넥션 풀이 어느 수준의 동시 요청까지 안정적으로 처리할 수 있는지 확인하는 것을 목표로 했습니다.

#### 테스트 대상 API

| 항목 | 값 |
|---|---|
| 테스트 API | `POST /test/payments/hotdeals/prepare?memberId={memberId}` |
| 주문 타입 | `HOTDEAL_DIRECT` |
| 주요 처리 | Redis 재고 선점, Orders 생성, OrderItem 생성, Payment 생성 |
| 테스트 도구 | k6 |

#### 테스트 조건

| 항목 | 값                                                      |
|---|--------------------------------------------------------|
| 요청 수 | 1000                                                   |
| 초기 Redis 재고 | 1000                                                   |
| 테스트 목적 | 재고 부족이 아닌 DB 커넥션 풀 한계 확인                               |
| 성공 기준 | 전체 요청 성공 (timeout/connection fail/DB resource fail 없음) |

재고 부족 실패가 테스트 결과에 섞이면 DB 커넥션 풀 한계를 정확히 판단하기 어렵기 때문에,
초기 Redis 재고를 요청 수와 동일하게 1000개로 설정하였습니다.

#### Baseline 테스트 결과

<details>
<summary>VUS = 200 결과 보기</summary>

![baseline-test-vus-200](docs/k6/baseline-test/baseline-vus-200.png)
</details>

<details>
<summary>VUS = 230 결과 보기</summary>

![baseline-test-vus-230](docs/k6/baseline-test/baseline-vus-230.png)
</details>

<details>
<summary>VUS = 235 결과 보기</summary>

![baseline-test-vus-235](docs/k6/baseline-test/baseline-vus-235.png)
</details>

<details>
<summary>VUS = 240 결과 보기</summary>

![baseline-test-vus-240](docs/k6/baseline-test/baseline-vus-240.png)
</details>

<details>
<summary>VUS = 250 결과 보기</summary>

![baseline-test-vus-250](docs/k6/baseline-test/baseline-vus-250.png)
</details>

| VUS | 요청 수 | 성공 수 | 실패 수          | p95 응답 시간 | 결과              |
|---|---|------|---------------|-----------|-----------------|
| 200 | 1000 | 1000 | 0             | 185.35ms  | 성공              |
| 230 | 1000 | 1000 | 0             | 228.14ms  | 성공              |
| 235 | 1000 | 1000 | 0             | 211.48ms  | 반복 성공           |
| 240 | 1000 | 937  | 63 | 201.57ms  | 실패 (timeout 발생) |
| 250 | 1000 | 932  | 68 | 228.59ms   | 실패 (timeout 발생)            |

Baseline에서는 VUS 235까지는 안정적으로 통과하지만, VUS 240이상부터 timeout이 발생했습니다. 
따라서 기본 설정에서의 안정 구간은 VUS 235, 한계 구간은 VUS240으로 판단했습니다.

#### 결과 분석

결제 준비 API는 Redis Lua Script를 이용한 재고 선점뿐 아니라, `Orders`, `OrderItem`, `Payment` 저장까지 함께 수행합니다.  
고로 stock test보다 DB 커넥션 사용량이 많아, 동시 요청 수가 증가할수록 HikariCP 커넥션 풀 한계가 결과에 영향을 주는 것을 확인했습니다.

Baseline 테스트에서는 VUS 200부터 VUS 235 구간까지는 모든 요청이 성공했지만, VUS 240 이상부터 timeout이 발생했습니다.  
이는 Redis 재고 부족이 아니라 DB 저장 과정에서 커넥션 풀 또는 서버 처리량의 한계가 드러난 것으로 판단했습니다.

이후 HikariCP 설정을 조정하며, DB 커넥션 풀 크기와 서버 스레드 설정이 결제 준비 API의 안정 구간에 어떤 영향을 주는지 테스트했습니다.

### (3) HikariCP 튜닝

#### Baseline 결과

| 항목 | 결과 |
|---|---|
| 테스트 API | `POST /test/payments/hotdeals/prepare` |
| 요청 수 | 1000 |
| 초기 Redis 재고 | 1000 |
| 안정 구간 | VUS 235 |
| 한계 구간 | VUS 240 |
| 주요 실패 양상 | timeout 발생 |

#### HikariCP 1차 튜닝

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 30
      minimum-idle: 10
      connection-timeout: 5000
```

#### 1차 튜닝 결과 및 분석

<details>
<summary>VUS = 235 결과 보기</summary>

![hikari-1-vus-235](./docs/k6/hikari-1/vus-235.png)
</details>

<details>
<summary>VUS = 240 결과 보기</summary>

![hikari-1-vus-240](./docs/k6/hikari-1/vus-240.png)
</details>

| VUS | 요청 수 | 성공 수 | 실패 수 | p95 응답 시간 | 결과              |
|---|---|------|------|-----------|-----------------|
| 235 | 1000 | 1000 | 0    | 277.54ms  | 성공              |
| 240 | 1000 | 992  | 8    | 230.9ms   | 실패 (timeout 발생) |

1차 튜닝에서는 HikariCP `maximum-pool-size`를 30으로 늘렸습니다.
그 결과 VUS 240 구간에서 p95 timeout 수는 개선되었지만, 여전히 timeout이 발생하여 안정 구간은 VUS 235로 유지되었습니다.

따라서 단순히 커넥션 풀 크기를 조금 늘리는 것만으로는 동시성 한계를 완전히 해결하기 어렵다고 판단했습니다.

#### HikariCP 2차 튜닝

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 50
      minimum-idle: 20
      connection-timeout: 5000
```

#### 2차 튜닝 결과 및 분석

<details>
<summary>VUS = 230 결과 보기</summary>

![hikari-2-vus-230](./docs/k6/hikari-2/vus-230.png)
</details>

<details>
<summary>VUS = 235 결과 보기</summary>

![hikari-2-vus-235](./docs/k6/hikari-2/vus-235.png)
</details>

| VUS | 요청 수 | 성공 수 | 실패 수 | p95 응답 시간 | 결과              |
|-----|---|------|------|-----------|-----------------|
| 230 | 1000 | 1000 | 0    | 288.27ms  | 성공              |
| 235 | 1000 | 954  | 46   | 242.56ms  | 실패 (timeout 발생) |]

2차 튜닝에서는 커넥션 풀 크기를 더 크게 늘렸지만, 오히려 안정구간이 낮아졌습니다.

이를 통해 커넥션 풀 크기를 무조건 크게 설정하는 것이 성능 향상으로 이어지지 않는다는 점을 확인했습니다.

#### HikariCP 3차 튜닝 (최종)

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 25
      minimum-idle: 20
      connection-timeout: 5000

server:
  tomcat:
    threads:
      max: 250
      min-spare: 20
    accept-count: 300
    max-connections: 8192
```

3차 튜닝에서는 커넥션 풀 크기를 과도하게 키우지 않고, Tomcat 스레드 및 대기 큐 설정을 함께 조정하여 테스트했습니다.
테스트를 하는 과정에서 발생한 timeout, connection refused, 요청 처리 지연 등의 현ㅅ앙이 HikariCP만의 문제가 아니라,
Tomcat이 동시에 요청을 받아 처리하는 능력과도 관련이 있기 때문입니다.

#### 3차 튜닝 결과 및 분석

<details>
<summary>VUS = 230 결과 보기</summary>

![hikari-3-vus-230](./docs/k6/hikari-3/vus-230.png)
![hikari-3-vus-230](./docs/k6/hikari-3/vus-230-fail.png)
</details>

<details>
<summary>VUS = 235 결과 보기</summary>

![hikari-3-vus-235](./docs/k6/hikari-3/vus-235.png)
</details>

<details>
<summary>VUS = 240 결과 보기</summary>

![hikari-3-vus-240](./docs/k6/hikari-3/vus-240.png)
</details>

<details>
<summary>VUS = 250 결과 보기</summary>

![hikari-3-vus-250](./docs/k6/hikari-3/vus-250.png)
[hikari-3-vus-250](./docs/k6/hikari-3/vus-250-fail.png)
</details>

| VUS | 요청 수 | 성공 수 | 실패 수 | p95 응답 시간 | 결과 |
|-----|---|------|------|----------|----|
| 230 | 1000 | 1000 | 0    | 240.08ms | 성공 |
| 230 | 1000 | 967  | 33   | 229.97ms | 실패 |
| 235 | 1000 | 1000 | 0    | 263.99ms | 성공 |
| 240 | 1000 | 1000 | 0    | 233.07ms | 성공 |
| 250 | 1000 | 1000 | 0    | 276.47ms | 성공 |
| 250 | 1000 | 922  | 78   | 314.98ms | 실패 |]


테스트 결과 VUS 235와 VUS 240까지 전체 요청이 반복적으로 성공하며. Baseline 대비 안정 구간이 VUS 235에서 VUS 240으로 개선되었습니다.
VUS 250은 성공과 실패가 혼재하여, 현재 로컬 Docker 테스트 환경에서의 한계 구간으로 판단했습니다.

일부 테스트에서는 안정 구간보다 낮은 VUS 230에서 connect refused가 발생했습니다.
그러나 더 높은 VUS에서 반복적으로 안정 통과한 결과와 모순되어, 해당 케이스는 애플리케이션 로직 또는 HikariCP 한계가 아닌, 
테스트 환경의 일시적 서버/포트 상태 문제로 분리하기로 했습니다.

최종 안정구간은 단일 실행 결과가 아니라, 동일 조건 반복 실행에서 성공이 재현되는지를 기준으로 판단했습니다.

### 최종 결과 분석

| 설정      | HikariCP 설정    | Tomcat 설정                         | 안정 구간    | 한계 구간  | 결과                           |
| ------- | -------------- | --------------------------------- | -------- | ------ | ---------------------------- |
| Baseline | 기본 설정          | 기본 설정                             | VUS 235  | VUS 240 | VUS 240부터 timeout 발생         |
| 1차 튜닝   | max 30 / min 10 | 기본 설정                             | VUS 235  | VUS 240 | 응답 시간 일부 개선, timeout 잔존      |
| 2차 튜닝   | max 50 / min 20 | 기본 설정                             | VUS 230  | VUS 235 | connection refused 발생, 안정성 하락 |
| 최종 튜닝   | max 25 / min 20 | max threads 250 / accept-count 300 | VUS 240  | VUS 250 | 안정 구간 개선                     |

HikariCP 튜닝을 통해 DB 커넥션 풀 크기는 단순히 크게 잡는 것이 아니라, 서버 스레드 수와 DB 처리 능력에 맞게 조정해야 한다는 점을 확인했습니다.

1차 튜닝에서는 일부 응답 시간이 개선되었지만 timeout이 남아있었고, 2차 튜닝에서는 커넥션 풀을 과도하게 늘리면서 오히려 안정성이 낮아졌습니다.

최종적으로는 maximum-pool-size를 25로 조정하고, Tomcat 스레드 설정을 함께 조정하여 VUS 240까지 안정적으로 처리할 수 있었습니다.

이를 통해 결제 준비 API처럼 DB 저장 작업이 포함된 흐름에서는 Redis 재고 선점만으로는 충분하지 않고, DB 커넥션 풀과 스레드 설정까지 함께 고려해야 한다는 것을 깨달았습니다.


## 8. 트러블 슈팅

프로젝트를 진행하며 발생한 주요 문제와 해결 과정을 정리했습니다.


<details>
<summary> 1. 알림 읽음 처리 API의 JSON 불일치 문제 </summary>

#### 문제 상황

알림 목록에서 특정 알림을 클릭하면 해당 알림이 읽음 처리되고, 우측 상단 알림 배지의 안 읽은 개수가 감소해야 했습니다.

하지만 구현 초기, 읽음 처리 API의 응답 구조(is_read)와 프론트엔드에서 기대하는 JSON 구조(read)가 맞지 않아  
DB에서는 `is_read` 값이 변경되었음에도 프론트 화면의 알림 상태와 배지 개수가 정상적으로 갱신되지 않는 문제가 발생했습니다.

#### 문제 해결

```java
@Getter
public class NotificationListResponse {
    private boolean read; //엔티티와 같은 isRead에서 변경
}

```
알림 목록 응답 DTO에 프론트엔드에서 필요한 값과 변수값을 동일하게 바꿔주었습니다.
이후 알림 클릭 후 다시 목록을 조회했을 때, 각 알림 읽음 여부와 이동에 필요한 값을 동일한 JSON 구조로 받을 수 있게 되었습니다.
</details>

<details>
<summary> 2. @LastModifiedDate 남용으로 인한 수정일 관리 문제 </summary>

#### 문제 상황

```java
@CreatedDate
private LocalDateTime createdAt;

@LastModifiedDate
private LocalDateTime updatedAt;
```

마이페이지의 문의 관리에서, 사용자가 작성한 문의의 작성일과 수정일을 함께 보여주도록 구현했습니다.

하지만 상품 문의 엔티티의 `updatedAt` 필드에 `@LastModifiedDate`를 사용하면서, 
사용자가 문의 내용을 수정한 경우뿐 아니라, 관리자 답변이 달리는 등 엔티티의 다른 값이 변경되는 경우에도 수정일이 갱신되는 문제가 발생했습니다.

#### 문제 해결

```java
private LocalDateTime updatedAt;

// 문의글 수정 메서드
public void updateInquiry(String title, String content, LocalDateTime now) {
    validateWaitingStatus();

    if (title != null && !title.isBlank()) {
        this.title = title;
    }
    if (content != null && !content.isBlank()) {
        this.content = content;
    }
    this.updatedAt = now;
}
```

문의 수정일은 Auditing에 의존하지 않고, 사용자가  문의 내용을 수정하는 시점에만 명시적으로 갱신되도록 수정했습니다.

관리자 답변 시간은 별도의 answeredAt필드로 관리하여, 문의 수정 시간과 답변 등록 시간이 서로 섞이지 않도록 했습니다.

이를 통해 @LastModifiedDate는 엔티티의 마지막 변경 시간을 관리하기에는 편히하지만, 
사용자가 문의 내용을 수정한 시간처럼 특정 비즈니스 이벤트를 표현해야 하는 경우에는 적합하지 않을 수 있다는 것을 확인했습니다.

따라서 자동 갱신 어노테이션을 사용하지 전에, 
해당 필드가 단순 시스템 시간이 필요한 것인지, 아니면 의미가 있는 비즈니스 시간인지 구분해야 하는 것을 알았습니다.

</details>

<details>
<summary> 3. k6 테스트 중 Stack Trace 및 Hibernate SQL 로그 폭발 문제 </summary>

#### 문제 상황

k6로 핫딜 결제 준비 API 부하 테스트를 진행하던 중, 테스트가 끝난 뒤에도 백엔드 터미널에 로그가 계속 출력되는 문제가 발생했습니다.

처음에는 서버가 아직 요청을 처리 중이라고 생각했지만, 확인해보니 대량의 예외 Stack Trace와 Hibernate SQL 로그가 콘솔에 밀려서 출력되고 있었습니다.

특히 `Redis stock = 300`, `VUS = 200`, `iterations = 1000` 조건에서 
Redis Lua Script는 성공적으로 재고 초과 판매를 막아냈지만, 일부 요청은 timeout으로 실패했습니다.
즉, 재고 부족이어야 할 요청 중 일부가 서버 응답까지 못가고 db 커넥션 대기/서버 처리 지연/요청 timeout에 걸린 것이었습니다.

#### 원인 분석

첫 번째 원인은 예외 응답 처리 방식이었습니다.

재고 부족과 같은 예상 가능한 실패가 발생했을 때, 
이를 명확한 HTTP 응답으로 변환하지 않으면 서버 로그에 Stack Trace가 대량으로 출력될 수 있었습니다.

부하 테스트에서는 재고가 300개이고 요청이 1000개라면, 700건은 재고 부족으로 실패하는 것이 정삽입니다.
하지만 이 싪채가 예외 Stack Trace로 계속 출력되면 콘솔 I/O 부하가 커지고, 실제 API 처리 성능을 왜곡할 수 있습니다.

두 번째 원인은 Hibernate SQL 로그였습니다.

Stack Trace 문제를 줄인 뒤에도 테스트 종료 후 로그가 계속 출력되어 확인해보니, 실제로는 에러 로그가 아니라 
Hibernate SQL 로그가 대량으로 출력되고 있었습니다. Hibernate가 DB에 날리는 `select`, `insert` 쿼리를 모두 콘솔에 출력하고 있었고, 
이 상태에서 VUS 200 수준의 요청을 보내어 콘솔 I/0 자원이 병목된 것이었습니다.

#### 문제 해결

먼저 k6 테스트 전용 결제 준비 API에서 예상 가능한 실패를 `try-catch`로 처리했습니다.

재고 부족처럼 서버 장애가 아닌 실패는 Stack Trace를 출력하는 대신, `409 Conflic`응답으로 반환되도록 수정했습니다.
```java
@PostMapping("/prepare")
public ResponseEntity<?> prepareForK6(@RequestParam Long memberId,
                                      @RequestBody PaymentPrepareRequest request){
    if(memberId == null){
        return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "테스트 회원 ID가 누락됨."
        ));
    }

    // stack trace 예외 폭발 방어를 위해 409 conflict 반환
    try{
        PaymentPrepareResponse response = paymentService.preparePayment(memberId, request);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", response
        ));
    }catch (IllegalStateException e){
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "success", false,
                "message", e.getMessage()
        ));
    }
}
```

이후 k6 스크립트에서 409 Conflict를 서버 장애가 아닌, 재고 부족과 같은 예상 가능한 비즈니스 실패로 분리해서 집계하도록 수정했습니다.

```yaml
spring.jpa.show-sql=false
```

또한 Hibernate SQL 로그를 비활성화했습니다.

###### 블로그 | https://jijbab-bodmbodm-1356.tistory.com/114

</details>

<details>
<summary> 4. Connection Refused와 JVM 튜닝 중단 판단 </summary>

#### 문제 상황

HikariCP 튜닝 이후에도 일부 부하 테스트 구간에서 `Connection refused`가 발생했습니다. 
특히 JVM 옵션을 적용한 뒤에도 안정성이 개선되지 않았고, 오히려 기존 안정 구간보다 낮은 VUS에서도 연결 거부가 발생했습니다.

#### 원인 분석 및 가설

처음에는 결제 준비 API에서 짧은 시간 동안 `Orders`, `OrderItem`, `Payment` 객체가 대량 생성되기 때문에, 
JVM 힙 크기나 GC 설정이 p95 응답 시간과 안정성에 영향을 줄 수 있다고 가정했습니다.

그래서 힙 크기를 512MB로 고정하고 G1GC를 적용했습니다.

```yaml
JAVA_TOOL_OPTIONS: "-Xms512m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

하지만 JVM 튜닝 후에도 Connection Refused가 줄어들지 않았고,
OutOfMemoryError, Java heap space, 컨테이너 재시작도 발생하지 않았습니다. 
따라서 문제를 JVM 메모리 부족이나 GC문제로 단정하기 어렵다고 판단했습니다.

추가로 로그를 확인한 결과, 요청 처리 과정에서 Tomcat 스레드와 요청 대기열도 병목 후보가 될 수 있다 판단했습니다. 
이후 Tomcat 스레드와 accept-count를 조정했지만, 여전히 성공과 실패가 혼재하였고, 
RabbitMQ, Docker desktop, localhost 포워딩 등 로컬 테스트 환경 노이즈 가능성도 확인했습니다.

#### 문제 해결 및 최종 파단

JVM 튜닝은 현재 로컬 Docker 테스크 환경에서 개선 효과가 확인되지 않았기 때문에 최종 설정에서 제외했습니다.

| 항목                                       | 판단             |
| ---------------------------------------- |----------------|
| Redis Lua Script                         | 핫딜 재고 선점 전략으로 유지 |
| HikariCP                                 | 3차 설정 유지       |
| Tomcat                                   | 요청 처리량 개선 설정 유지 |
| JVM 튜닝                                   | 개선 효과가 없어 제외   |
| RabbitMQ / Docker Desktop / localhost 포워딩 | 테스트 환경 노이즈 후보로 기록 |

이번 과정을 통해 성능 튜닝은 설정을 많이 추가하는 것보다, 
실제 측정 결과를 기준으로 효과가 있는 설정과 없는 설정을 구분하는 것이 중료하다는 점을 확인했습니다.

###### 블로그 | https://jijbab-bodmbodm-1356.tistory.com/115

</details>

### 개선 예정
- 회원정보 변경 페이지 접근 전 비밀번호 재인증 상태를 세션에 저장하고 있으나, 
재인증 상태가 오래 유지될 경우 뒤로가기 또는 URL 직접 입력으로 변경 페이지에 재접근할 수 있는 문제가 있습니다.
- 추후 재인증 상태를 일회성 토큰처럼 짧게 사용하고, 회원정보 변경 페이지 진입 또는 일정 시간 경과 후 제거하는 방식으로 개선할 예정입니다.

## 9. 배포 및 시연

### 배포 주소
- 배포 환경: AWS EC2 Ubuntu + Docker Compose
- 배포 구성: Frontend, Backend, MySQL, Redis, RabbitMQ
- 배포 URL: http://52.78.246.154

>테스트용 관리자 계정
> 
> ID : admin 
> 
> PASSWORD : AdminPassword1234!

>테스트용 회원 계정
>
> ID : user1
>
> PASSWORD : UserPassword1234!

### 시연 영상
[WAT 시연 영상 보기](영상_링크)


### 주요 UI

#### 1. 메인 페이지

#### 2. 알림

#### 3. 리뷰 페이지

#### 4. PortOne 결제창

## 10. 회고록/블로그

WAT 프로젝트는 단순한 핫딜 쇼핑몰 CRUD 구현을 넘어, 동시성 제어와 성능 테스트까지 직접 다뤄본 프로젝트였습니다.

초기에는 기능 구현을 우선으로 진행했지만, 프로젝트가 커질수록 도메인 설계와 API 응답 구조의 중요성을 체감했습니다. 
특히 알림 JSON 응답 구조 불일치, 문의 수정일 관리 문제를 겪으며 백엔드 API는 단순히 데이터를 내려주는 것이 아니라, 
프론트엔드 화면 흐름과 도메인 의미를 함께 고려해야 한다는 점을 배웠습니다.

가장 큰 학습은 재고 정합성과 성능 테스트였습니다. 
No Lock, Pessimistic Lock, Redis Lua Script를 비교하며 동시성 제어 방식에 따라 데이터 정합성과 응답 시간이 크게 달라지는 것을 직접 확인했습니다. 
또한 k6 부하 테스트와 HikariCP 튜닝을 통해 Redis로 재고 선점을 빠르게 처리하더라도, 
실제 결제 준비 API에서는 `Orders`, `OrderItem`, `Payment` 저장 과정에서 DB 커넥션 풀과 서버 요청 처리량이 새로운 병목이 될 수 있음을 확인했습니다.

이번 프로젝트를 통해 "기능이 동작하는 코드"와 "트래픽 상황에서도 안정적으로 동작하는 코드"는 다르다는 것을 체감했습니다.  
앞으로는 기능 구현 단계부터 도메인 책임, 트랜잭션 범위, 테스트 전략, 운영 환경까지 함께 고려하는 방향으로 프로젝트를 개선해 나가고 싶습니다.

### 향후 개선 방향
- DTO Mapper / Factory 도입을 통한 코드 구조 정리
- Spring Security 기반 인증/인가 구조로 개선
- 테스트 환경과 운영 환경 분리
- 배포 환경에서의 성능 테스트 재측정
- Redis 장애 상황에 대한 보완 전략 검토

###### 블로그 | https://jijbab-bodmbodm-1356.tistory.com/116 (개발이 아닌 스스로의 성장에 대하여)
