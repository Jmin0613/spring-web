package demo.demo_spring.payment.portone;

import demo.demo_spring.payment.config.PortOneProperties;
import demo.demo_spring.payment.portone.dto.PortOneCancelRequest;
import demo.demo_spring.payment.portone.dto.PortOnePaymentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor // PortOneProperties 생성자 주입받게 넣음.
// -> 다른 생성자들도 빈 어노테이션 + final이면 이걸로 교체 가능.
public class PortOneClient {

    private static final String BASE_URL = "https://api.portone.io"; //PortOne API 서버 기본 주소

    private final PortOneProperties portOneProperties;
    // 여기에 환경변수로 넣은 API Secret 들어있음.
    // 즉, portOneProperties.getApiSecret()으로 비밀키를 꺼내서 인증 헤더에 넣음.

    //RestClient이용해 PortOne서버에 요청을 보냄 (백 -> PortOne)
    private final RestClient restClient = RestClient.builder()
            .baseUrl(BASE_URL)
            .build();
    /* 도메인객체가 아니라 HTTP요청 도구이고, 기본 URL같은 설정을 조립해야함. 그래서 RestClient.builder()사용 */

    // 결제 정보 조회 요청
    public PortOnePaymentResponse getPayment(String paymentId) { //PortOne에 결제 단건 조회

//        System.out.println("PORTONE apiSecret exists = " +
//                (portOneProperties.getApiSecret() != null && !portOneProperties.getApiSecret().isBlank()));
//
//        System.out.println("PORTONE apiSecret length = " +
//                (portOneProperties.getApiSecret() == null ? 0 : portOneProperties.getApiSecret().length()));
//
//        System.out.println("PORTONE storeId exists = " +
//                (portOneProperties.getStoreId() != null && !portOneProperties.getStoreId().isBlank()));
//
//        System.out.println("PORTONE apiSecret = " + portOneProperties.getApiSecret());
//        System.out.println("PORTONE storeId = " + portOneProperties.getStoreId());

        return restClient.get() //HTTP GET 요청 보내겠다
                .uri("/payments/{paymentId}", paymentId) // 최종 주소 형태
                .header(HttpHeaders.AUTHORIZATION, "PortOne " + portOneProperties.getApiSecret())
                // 인증헤더 붙이기 -> header(이름, 값("PortOne" + API Secret))
                .retrieve() // 요청 보내고 응답 받아올 준비
                .body(PortOnePaymentResponse.class); // 응답 json을 PortOnePaymentResponse 자바 객체로 변환.

        //PortOne에 paymentId로 결제 정보를 조회하고,
        //응답 JSON을 PortOnePaymentResponse 객체로 변환해서 반환.
    }

    // 결제 취소 요청
    public void cancelPayment(String paymentId, String reason) {
        restClient.post()
                .uri("/payments/{paymentId}/cancel", paymentId)
                .header(HttpHeaders.AUTHORIZATION, "PortOne " + portOneProperties.getApiSecret())
                .body(new PortOneCancelRequest(reason)) //PortOne에 보낼 요청 본문
                .retrieve() // 요청 보내고 응답 받아올 준비
                .toBodilessEntity(); //근데 응답body는 필요없고, 성공/실패 여부만. -> 결제 취소요청이니간 성공여부만 중요.
    }
}
