import axios from 'axios'
// axios : 브라우저에서 백엔드 서버로 데이터를 보내거나 가져올때 가장 많이 사용하는 도구
import type { ProductInquiryListItem } from '../types/inquiry'
// TS에서는 백엔드에서 올 데이터가 어떤 모양인지 미리 정의해둠.
// 이건 "데이터의 생김새(설계도)를 가져오라"는 의미.
// 이렇게 타입을 정해두면, 코드를 짤 때 오타를 내거나 잘못된 데이터를 넣으려고 하면
// 에디터가 즉시 빩나 줄로 경고를 줌. 사고를 미리 막아주는 안전장치!!!

const API_BASE_URL = 'http://localhost:8080'
// 백엔드 서버가 살고 있는 집 주소
// 모든 API 요청의 앞부분에 붙을 공통 주소임. 지금은 localhost8080에서 돌아가고있음.

// "문의 목록 가져오는 함수"를 적는 파일
// 상품 id를 넘김 -> 백엔드에 요청 보냄 -> 문의 목록 배열을 받음
export async function fetchProductInquiries(productId: string ): Promise<ProductInquiryListItem[]> {
    // export -> 이 함수를 다른 파일에서도 불러와서 쓸 수 있게 내보냄
    // async -> 이 함수는 비동기(Asynchronous)로 작동한다 선언. 서버에 물어보고 답을 기다리는 동안 브라우저 멈추지 않음.
    // productId: string -> 어떤 상품의 문의를 가져올지 알려줌
    // Promise -> 지금 당장은 아니지만, 조금 뒤에 데이터를 꼭 돌려주겠다는 일종의 약속
    // <Promise<>ProductInquiryListItem[]> -> 그 약속의 결과물은 ProductInquiryListItem이라는 모양을 가진 객체List라는 뜻

    const response = await axios.get(`${API_BASE_URL}/products/${productId}/inquiries`)
    // await -> 서버에서 응답이 올 때까지 다음줄로 넘어가지 않고 잠시 기다림
    // axios.get(...) -> Axios 도구를 이용해 서버에 GET(조회) 요청을 보냄
    // ${...} 템플릿 리터럴 -> 변수를 주소창에 합치기.

    return response.data // 서버에서 온 응답 뭉치(response) 중에서 필요한 데이터(data)만 골라내서 반환
    // response안에는 data, status(http상태코드), headers, config등 여러가지 담겨있어서, data만 빼서 줘야함.
}