import { useEffect, useMemo, useState } from 'react'
// useState(상태 관리자) : 화면에 보여줄 데이터를 기억하고 관리
// 좋아요 개수처럼 사용자가 클릭할때마다 숫자가 바뀌어야 한다면 useState를 써서 그 값을 저장.
// 값이 바뀌면 리액트가 알아서 화면을 다시 그림.
// -> 변수 선언 (데이터 보관용)

// useMemo(계산 결과 캐싱) : 산 비용이 비싼 데이터를 메모리에 들고 있다가 재사용
// -> Redis 캐싱 또는 Local Cache

// useEffect(실행 감시자) : 컴포넌가 화면에 나타날 때(등장), 사라질 때(퇴장), 혹은 특정 데이터가 바뀔때 자동실행될 코드를 적는 곳
// "페이지가 열리자마자 백엔드에서 공지사랑 목록을 가져와라 같은 명령을 내릴 때 사용"
// -> 생성자(Constructor) 또는 특정 Event Listener

import axios from 'axios'

import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
// 페이지 이동(라우팅) 담당하는 별도의 라이브러리 도구들

import SiteHeader from '../components/SiteHeader'
//다른곳에 만들어둔 상단바 컴포넌트 가져오기

// 프론트엔드에서 이렇게 type을 명시적으로 만드는 이유는 개발자의 실수를 컴퓨터가 실시간으로 잡아내기 위해.
// 코드 짤때 오타나거나 틀릴때 바로 알려주는 자동 검사기 역할
// 역할 : 오타 방지, 데이터 유무 확인(?이용), 프론트엔드와 백엔드 사이의 약속

type ProductDetail = { //상품 상세정보
    id: number
    category: string
    imageUrl: string | null //imageUrl 있을수도 있고 없을수도 있고. 현재 개발중이라 이미지를 안넣고 진행.
    name: string
    description: string
    price: number
    status: string
}

type WriterLabelTarget = ProductInquiryListItem | ProductInquiryDetailItem | ProductReviewItem

type ReviewSortType = 'BEST' | 'LATEST' // 리뷰 정렬 방식은 오직 이 두가지 중 하나만 허용하겠다는 의미
// type -> 새로운 타입을 만들겠다는 키워드
// ReviewSortType이라는 새로운 데이터 타입을 정의하는 것
// java의 Enum과 완벽히 대응

type ReviewSummary = { //리뷰 통계 요약
    averageRating: number
    totalCount: number
    fiveStarCount: number
    fourStarCount: number
    threeStarCount: number
    twoStarCount: number
    oneStarCount: number
}

type ProductReviewItem = { // 리뷰 상품 정보
    reviewId: number
    writerNickName?: string
    rating: number
    title: string
    content: string
    createdAt: string
    likeCount?: number
    likedByCurrentUser?: boolean
    productNameSnapshot?: string
    quantity?: number
}

type ReviewPageResponse = { // 리뷰 페이지
    summary: ReviewSummary
    reviews: ProductReviewItem[]
    page: number
    size: number
    totalElements: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
}

type ReviewLikeToggleResponse = { // 리뷰 추천 toggle
    reviewId: number
    liked: boolean
    likeCount: number
}

type ProductInquiryListItem = { // 문의 게시글
    id: number
    title: string
    writerNickName?: string
    writerId?: number
    status: 'WAITING' | 'ANSWERED' // 정해진 문자열만 쓰기 (Enum)
    createdAt: string
    secret?: boolean
}

type ProductInquiryDetailItem = { // 문의 상세보기
    inquiryId: number
    productId: number
    productNameSnapshot: string
    title: string
    content: string
    answerContent: string | null
    status: 'WAITING' | 'ANSWERED'
    createdAt: string
    answeredAt?: string | null
    updatedAt?: string
    writerNickName?: string
}

type MemberInfo = { // 로그인 멤버 정보
    id: number
    nickName?: string
    name?: string
}

type ProductDetailTab = 'detail' | 'review' | 'inquiry' //상품 상세페이지 탭은 이 세가지만 사용하겠다.

const API_BASE_URL = 'http://localhost:8080' // 서버 주소. 프론트엔드가 데이터를 달라고 요청을 보낼 백엔드 서버의 기본 주소임.
const PAGE_SIZE = 10 // 페이지 크기. 한 페이지당 개수.

// function -> 함수 선언 키워드
function formatPrice(price: number) {
    // Template Literal Types : 백틱(`)을 사용하여 문자열 리터럴의 조합을 기반으로 새로운 문자열 타입을 동적으로 생성하는 기능.
    return `${price.toLocaleString('ko-KR')}원`
    // toLocalString : 숫자나 날짜 데이터를 해당 나라의 언어와 관습(Locale)에 맞춰서 문자열로 바꿔줌.
}

function getStatusLabel(status: string) {
    if (status === 'ON_SALE') return '판매중'
    if (status === 'SOLD_OUT') return '품절'
    return status
}

function getInquiryStatusLabel(status: 'WAITING' | 'ANSWERED') {
    if (status === 'ANSWERED') return '답변완료'
    return '답변대기'
}

function formatInquiryDate(dateTime: string) {
    return dateTime.slice(0, 10).replaceAll('-', '.')
    // 자바에서의 String.substring(), replace()와 같음
    // 서버에서 보내준 길고 복잡한 날짜 데이터를 년.월.일만 남기고 예쁘게 잘라버림.

    //slice(0, 10) -> 자르기
    // 문자열 0번쨰부터 10번째 직전까지(즉, 9번째까지)만 자름.
    // 2026-04-22T01:59:07 -> 2026-04-22
    // String.substring(0, 10)과 같음.

    //replaceAll('-', '.') -> 바꾸기
    // 문자열에 포함된 모든 대시(-)를 마침표(.)로 한꺼번에 바꿈
    // 2026-04-22 -> 2026.04.22
    // 자바의 String.replace("-", ".")와 같음.
    // replace는 가장 처음 발견된 하나만 바꿈. 그치만 replaceAll은 일치하는 모든 항목을 바꿈.

    //이렇게 하는 이유 :
    // 보통 서버(db)는 데이터를 2026-04-22T01:59:07.123Z같이 ISO 8601 형식으로 보냄.
    // 하지만 사용자 화면에서 이걸 다 보여줄 필요 없음.
}

function getEmoji(name: string) {
    // 아직 테스트 서버라서 이미지 데이터가 없음. 테스트 편의성을 위해 플레이스홀더로 대체.
    // Placeholder : 자리를 미리 차지하고 있는 데이터

    if (!name) return '🎁'
    return '🛍️'
}

function formatReviewDate(dateTime: string) {
    return dateTime.slice(0, 10).replaceAll('-', '.')
}

function renderStars(rating: number) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating) // 별점 데이터(rating)를 별모양으로 바꿔서 시각화
}

function getRatingPercent(count: number, total: number) {
    if (total === 0) return 0
    return Math.round((count / total) * 100)
    //Math.round -> 반올림
}

function getReviewLikeLabel(likeCount: number) { // 리뷰 추천버튼에 들어가는 텍스트
    //추천수 == 0
    if (likeCount <= 0) {
        return '도움이 돼요'
    }

    // 추천수 1이상
    return `${likeCount}명에게 도움이 됐어요`
}

// 화면에 보여줄 작성자 닉네임
function getWriterLabel(target: WriterLabelTarget) {
    return target.writerNickName ?? '알 수 없음'
}

function isSecretInquiry(inquiry: ProductInquiryListItem) {
    return inquiry.secret === true
}

// 문의 작성 에러 메세지
function getInquirySubmitErrorMessage(error: unknown, mode: 'create' | 'edit') {
    // error : unknown -> 에러가 발생햇는데, 정확히 어떤 형태인지 아직 모르는 경우
    // any 보다 안전함. 타이을 확인하기 전까지는 함부로 속성을 쓸수없게 막기때운 -> 타입 가드(Type Guard)를 강제

    if (axios.isAxiosError(error)) {
        // unknown타입 에러가 혹시 Axios(HTTP 통신 라이브러리)에서 발생한 에러인지 확인
        // 통과하는 수간, error를 AxiosError타입으로 간주하여 response, status같은 속성 사용 가능해짐.

        // error.response로 ResponseEntity 내용이 통째로 담겨옴.
        const status = error.response?.status // HTTP 상태 코드 (404, 500 등등)
        const responseData = error.response?.data // 서버가 보낸 실제 에러 본문

        if (status === 401 || status === 403) {
            return mode === 'edit'
                ? '문의 수정은 작성자만 가능합니다.'
                : '문의 작성은 로그인 후 이용해주세요.'
            // 401 -> Unauthorized. 누구세요? 비로그인 상태 또는 인증 만료.
            // 403 -> Forbidden. 권한없음. 로그인은 했지만 접근 권한 X
        }

        if (typeof responseData === 'string' && responseData.trim()) { //trim() -> 문자열 양 끝의 공백 제거
            // typeof 변수/값 -> 변수/값 해당 타입의 이름을 문자열로 반환
            return responseData
        }

        if (
            responseData && // 1. 데이터가 존재하는지(null아님) -> if(responseData != null)
            typeof responseData === 'object' && // 2. 타입이 객체object 형태인지
            'message' in responseData && // 3. 객체 안에 message라는 키가 들어있는지
            typeof responseData.message === 'string' //4. 그 message는 문자열인지
        ) {
            return responseData.message
        }
    }
    return mode === 'edit'
        ? '문의 수정에 실패했습니다.'
        : '문의 등록에 실패했습니다.'

}

function getInquiryDetailErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const responseData = error.response?.data

        if (status === 401 || status === 403) {
            return '비밀글은 작성자만 조회할 수 있습니다.'
        }

        if (typeof responseData === 'string' && responseData.trim()) {
            return responseData
        }

        if (
            responseData &&
            typeof responseData === 'object' &&
            'message' in responseData &&
            typeof responseData.message === 'string'
        ) {
            return responseData.message
        }
    }

    return '문의 내용을 불러오지 못했습니다.'
}

function getInquiryListErrorMessage(error: unknown) {
    // 여기서는 401, 403 체크 X -> API성격이 다름.
    // 로그인 안해도 접근 가능하기 때문.

    if (axios.isAxiosError(error)) {
        const responseData = error.response?.data

        if (typeof responseData === 'string' && responseData.trim()) {
            return responseData
        }

        if (
            responseData &&
            typeof responseData === 'object' &&
            'message' in responseData &&
            typeof responseData.message === 'string'
        ) {
            return responseData.message
        }
    }

    return '상품문의를 불러오지 못했습니다.'
}

// 별점(rating)별 비율 바(bar)
// 별점 바 한 줄 그리는 재사용 조각
function ReviewRatingRow({ label, percent, } : { label: string; percent: number }) {
                        // { 1. Props }       { 2. 타입 정의 }
    return (
        // <div> : Block-level 요소. body 문서 안에서 각 영역의 세션을 구분하고 정의함.
        // <span> : Inline 요소. 일반적으로 텍스트 색, 크기, 좌우간격을 조절하는데 사용함.
        // 바깥 박스 : 전체 바(track)
        // 안쪽 박스 : 채워진 부분(fill)
        // 객체 스타일을 복붙해서 가져온 다음, 일부만 덮어쓰기위해 ...스타일 사용

        // reviewRatingRowStyle이라는 스타일 객체 적용
        <div style={reviewRatingRowStyle}>
            <span style={reviewRatingLabelStyle}>{label}</span>

            <div style={reviewBarTrackStyle}>
                <div
                    style={{
                        ...reviewBarFillStyle,
                        width: `${percent}%`,
                    }}
                />
            </div>

            <span style={reviewRatingPercentStyle}>{percent}%</span>
        </div>
    )
}

// 데이터 로딩 중이거나, 에러 발생했을 때, 검색 결과 없을 때같이
// 특정한 상황(State)을 사용자에게 알리는 메세지 박스 부품
function PageState({ text }: { text: string }) {
    return <div style={stateBoxStyle}>{text}</div>
}

export default function ProductDetailPage() {
    const navigate = useNavigate()
    const location = useLocation()

    // {} -> 객체 구조 분해. 이름이 중요할 때.
    // 객체 안에 있는 여러 데이터 중, 원하는 '이름'의 필드만 쏙 골라오기.

    // [] -> 배열 구조 분해. 순서 중요할 때.
    // 첫 번째는 현재값, 두 번째는 값을 바꾸는 함수라는 순서가 약속되어 있음. [값, 함수]

    // useState<a||b> -> a객체일수도 b객체일수도 (java의 Optional<T>)
    // use<...>(c) -> c는 초기값

    /* 주소 및 url 파라미터 관리 */
    const { id } = useParams()
    // url에서 상품 id 가져옴
    const [searchParams, setSearchParams] = useSearchParams()
    // url 뒤의 쿼리 스트링(?tab=review)을 읽거나 수정하 때 사용

    /* 상품 상세 정보 상태 */
    const [detail, setDetail] = useState<ProductDetail | null>(null)
    // 서버에서 받아온 상품의 상세 데이터를 저장함.
    const [loading, setLoading] = useState(true)
    // 상품 정보를 불러오는 중인지 알려줌. 기본값 true는 불러오는 중이란 의미.
    const [error, setError] = useState('')
    // 상품 정보를 불러오다 실패했을 때 에러 메세지를 담음

    /* 탭tab(상세설명/리뷰/문의) 전화 로직 */
    const tabParam = searchParams.get('tab')
    // 주소창의 ?tab=... 에서 tab값을 꺼내어 tabParam에 넣기
    const activeTab: ProductDetailTab =
        tabParam === 'review' || tabParam === 'inquiry' ? tabParam : 'detail' // 조건 ? 참일때 값 : 거짓이때 값
    // 탭 값이 review이나 inquiry면 그 값을 쓰고, 아니면 기본값으로 detail을 선택.

    /* 리뷰(후기) 관리 상태 */
    const [reviewSort, setReviewSort] = useState<ReviewSortType>('BEST')
    // 리뷰 정렬 기준. 기본은 BEST(추천순)으로 설정
    const [reviewRatingFilter, setReviewRatingFilter] = useState<number | 'ALL'>('ALL')
    // 별점 필터. 특정 점수(1~5)만 볼지, 전체(ALL)볼지 결정. 기본은 전체(ALL).
    const [reviewPage, setReviewPage] = useState(0)
    // 리뷰 페이지 번호로 관리 (0페이지부터 시작)

    const [reviewPageData, setReviewPageData] = useState<ReviewPageResponse | null>(null)
    // 서버에서 받아온 현재 페이지의 리뷰목록과 페이지 정보 전체를 담음.
    const [reviewsLoading, setReviewsLoading] = useState(false)
    // 리뷰 데이터를 새로 고쳐 쓰는 중인지 나타냄.
    const [reviewsError, setReviewsError] = useState('')
    // 리뷰를 불러오지 못했을 때 사용할 에러 메세지.

    /* 리뷰 추천(도움이 돼요) 기능 */
    const [likedReviewMap, setLikedReviewMap] = useState<Record<number, boolean>>({})
    // 어떤 리뷰에 추천 눌렀는지 저장. {ReviewId : true}
    const [reviewLikeLoadingMap, setReviewLikeLoadingMap] = useState<Record<number, boolean>>({})
    // 추천 버튼 눌렀을 때, 서버 응답을 기다리는 중인지 리뷰별로 관리.

    /* 문의 목록 관리 */
    const [inquiries, setInquiries] = useState<ProductInquiryListItem[]>([])
    // 문의 목록 데이터를 받는 배열.
    const [inquiriesLoading, setInquiriesLoading] = useState(true)
    // 문의 목록을 불러오는 중인지 관리.
    const [inquiriesError, setInquiriesError] = useState('')
    // 문의 목록 불러오지 못했을 때 사용할 에러 메세지.

    /* 문의사항 상세 내용 */
    const [openInquiryId, setOpenInquiryId] = useState<number | null>(null)
    // 현재 버튼 클릭해서 내용이 펼쳐져 있는 문의글의 id를 기억
    const [inquiryDetailMap, setInquiryDetailMap] = useState<Record<number, ProductInquiryDetailItem>>({})
    // 한 번 읽은 문의 상세 내용을 id별로 저장해둬서 다시 읽을 때 속도 높임.
    const [inquiryDetailLoadingId, setInquiryDetailLoadingId] = useState<number | null>(null)
    // 특정 문의 상세 내용을 서버에서 가져오는 중인지 해당 id를 기록
    const [inquiryDetailErrorMap, setInquiryDetailErrorMap] = useState<Record<number, string>>({})
    // 특정 문의 상세 불러오지 못했을 때, 어디서 에서 에러났는지 저장

    /* 사용자 및 화면 모드 */
    const [currentMember, setCurrentMember] = useState<MemberInfo | null>(null)
    // 지금 이 페이지를 보고 있는 "내 정보". 로그인 여부 확인용.

    const [viewMode, setViewMode] = useState<'all' | 'mine'>('all')
    // 문의를 전체볼지, 내가 쓴 것만 볼지 결정
    const [currentPage, setCurrentPage] = useState(1)
    // 문의 목록 현재 페이지 번호

    /* 문의 작성 폼(글쓰기) */
    const [showInquiryForm, setShowInquiryForm] = useState(false)
    // 문의 작성 창(입력창)을 보여줄지 말지 결정하는 스위치
    const [inquiryForm, setInquiryForm] = useState({
        // 사용자가 입력 중인 제목, 내용, 비밀글 여부를 실시간으로 저장하는 객체
        title: '',
        content: '',
        secret: false,
    })
    const [inquirySubmitLoading, setInquirySubmitLoading] = useState(false)
    // 등록 버튼 클릭 후, 서버에 저장중인지 관리(중복 클릭 방지)
    const [inquirySubmitError, setInquirySubmitError] = useState('')
    // 등록 실패 시, 사용자에게 보여줄 에러메세지.

    const [editingInquiryId, setEditingInquiryId] = useState<number | null>(null)

    function moveToLoginPage() {
        navigate('/login', {
            state: {
                from: {
                    pathname: location.pathname,
                    search: location.search,
                    hash: location.hash,
                },
            },
        })
    }

    function handleTabChange(tab: ProductDetailTab) {
        const nextSearchParams = new URLSearchParams(searchParams)

        if (tab === 'detail') {
            nextSearchParams.delete('tab')
        } else {
            nextSearchParams.set('tab', tab)
        }

        setSearchParams(nextSearchParams)
    }

    async function loadProductDetail() {
        if (!id) {
            setError('잘못된 접근입니다.')
            setLoading(false)
            return
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/products/${id}`)
            setDetail(response.data)
        } catch (e) {
            setError('상품 상세를 불러오지 못했습니다.')
        } finally {
            setLoading(false)
        }
    }

    async function loadReviews() {
        if (!id) {
            setReviewsError('상품 정보가 올바르지 않습니다.')
            return
        }

        try {
            setReviewsLoading(true)
            setReviewsError('')

            const params: Record<string, string | number> = {
                sort: reviewSort,
                page: reviewPage,
                size: 10,
            }

            if (reviewRatingFilter !== 'ALL') {
                params.rating = reviewRatingFilter
            }

            const response = await axios.get<ReviewPageResponse>(
                `${API_BASE_URL}/products/${id}/reviews`,
                {
                    params,
                    withCredentials: true,
                },
            )

            const nextLikedMap: Record<number, boolean> = {}

            response.data.reviews.forEach((review) => {
                nextLikedMap[review.reviewId] = review.likedByCurrentUser ?? false
            })

            setReviewPageData(response.data)

            setLikedReviewMap(nextLikedMap)
        } catch (e) {
            setReviewsError('상품후기를 불러오지 못했습니다.')
        } finally {
            setReviewsLoading(false)
        }
    }

    async function loadInquiries() {
        if (!id) {
            setInquiriesError('상품 정보가 올바르지 않습니다.')
            setInquiriesLoading(false)
            return
        }

        try {
            setInquiriesLoading(true)
            setInquiriesError('')
            const response = await axios.get(`${API_BASE_URL}/products/${id}/inquiries`)
            setInquiries(response.data)
        } catch (e) {
            setInquiriesError(getInquiryListErrorMessage(e))
        } finally {
            setInquiriesLoading(false)
        }
    }

    async function loadMyInfo() {
        try {
            const response = await axios.get(`${API_BASE_URL}/members/myinfo`, {
                withCredentials: true,
            })

            if (!response.data) {
                setCurrentMember(null)
                return
            }

            setCurrentMember(response.data)
        } catch (e) {
            setCurrentMember(null)
        }
    }

    //useEffect -> 특정 이벤트(상태변경)가 발생했을 때 자동으로 실행되는 트리거 또는 후속 처리기
    /* 
        useEffect(() => {
        실행할코드
        }, [감시할값들])
     */
    useEffect(() => {
        void loadProductDetail()
    }, [id])
    // 페이지가 처음 열리거나 id가 바뀌면 loadProductDetail() 실행

    useEffect(() => {
        void loadReviews()
    }, [id, reviewSort, reviewRatingFilter, reviewPage])
    // 처음 페이지 열릴때 + id 바뀔때 + 정렬 바뀔때 + 별점 필터 바뀔때 + 페이지 번호 바뀔 때 loadReviews()실행

    useEffect(() => {
        setReviewPage(0)
    }, [reviewSort, reviewRatingFilter])
    // 정렬 바뀔때 + 별점 필터 바뀔때 reviewPage를 0으로 바꾼다.

    useEffect(() => {
        void loadInquiries()
    }, [id])
    // 처음 페이지 열릴때 + id 바뀔때 loadInquiries()

    useEffect(() => {
        void loadMyInfo()
    }, [])
    // 처음 한 번만 실행
    // []는 감시할 값이 없다는 뜻. 처음 마운트될 때만 실행.

    /*
    실행 순서 :
        1. 컴포넌트가 처음 렌더링 됨
        2. useEffect들이 한 번씩 실행됨
        3. 상품 상세 불러오고, 리뷰 불러오고, 문의 불러오고, 내 정보 불러오고한 결과가 state에 저장됨
        4. 화면이 다시 그려짐

    즉, useEffect는 화면 렌더 후에 필요한 부가 작업(API 호출 같은 것)을 자동 실행하는 곳임.
     */

    const reviewSummary = reviewPageData?.summary ?? null
    const reviewItems = reviewPageData?.reviews ?? []
    const reviewTotalPages = reviewPageData?.totalPages ?? 0
    const reviewHasNext = reviewPageData?.hasNext ?? false
    const reviewHasPrevious = reviewPageData?.hasPrevious ?? false

    const totalReviewCount = reviewSummary?.totalCount ?? 0
    const fiveStarPercent = reviewSummary ? getRatingPercent(reviewSummary.fiveStarCount, totalReviewCount) : 0
    const fourStarPercent = reviewSummary ? getRatingPercent(reviewSummary.fourStarCount, totalReviewCount) : 0
    const threeStarPercent = reviewSummary ? getRatingPercent(reviewSummary.threeStarCount, totalReviewCount) : 0
    const twoStarPercent = reviewSummary ? getRatingPercent(reviewSummary.twoStarCount, totalReviewCount) : 0
    const oneStarPercent = reviewSummary ? getRatingPercent(reviewSummary.oneStarCount, totalReviewCount) : 0

    function isMyInquiry(inquiry: ProductInquiryListItem) {
        if (!currentMember?.id) {
            return false
        }

        return inquiry.writerId === currentMember.id
    }

    const filteredInquiries = useMemo(() => {
        if (viewMode === 'mine') {
            return inquiries.filter(isMyInquiry)
        }
        return inquiries
    }, [inquiries, viewMode, currentMember])

    const totalPages = Math.max(1, Math.ceil(filteredInquiries.length / PAGE_SIZE))

    useEffect(() => {
        setCurrentPage(1)
    }, [viewMode])

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

    const pagedInquiries = filteredInquiries.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    )

    async function handleToggleReviewLike(reviewId: number) {
        if (!id) return

        try {
            setReviewLikeLoadingMap((prev) => ({
                ...prev,
                [reviewId]: true,
            }))

            const response = await axios.post<ReviewLikeToggleResponse>(
                // await -> 비동기 동작. await안붙으면 응답 안기다리고 다음 코드로 넘어감.
                // axios.post -> HTTP POST 요청

                // axios.post(주소, 보낼데이터, 설정옵션)
                // 주소(어디로 요청할지) + 보낼데이터(서버에 보낼 body데이터) + 설정옵션(요청방식의 세부설정)
                `${API_BASE_URL}/products/${id}/reviews/${reviewId}/like`, // 서버의 어떤 API 호출할지 결정하는 URL 주소
                {}, //Request Body(데이터).
                // 비어있는 이유 -> 토글은 특정 데이터를 새로 생성하기보다, "해당 경로로 요청이 왔다"는 사실이 중요하기 때문.
                // 백엔드 매핑 : @RequestBody로 받을 객체가 현재는 비어있는 상태임을 의미.
                { withCredentials: true }, //Config Options 설정 -> 요청에 대한 세부설정(Configuration)임.
                // 이 요청을 보낼 때 브라우저에 저장된 쿠키나 인증헤더를 자동으로 포함해서 보내라는 의미.
                // 이거 없으면 서버는 누가 좋아요를 눌럿는지 알 수 없음.(세션/쿠키 확인 불가)

                //브라우저는 보통 로그인 정보를 쿠키로 들고있음. 이 쿠키는 브라우저 사용자가 누구인지 서버가 알아보는데 사용됨.
                // 그런데 프론트가 백엔드로 요청을 보낼때, 쿠키를 자동으로 항상 같이 보내는 건 아님.
                // 특히 프론트 주소와 백엔드 주소가 다르면 더 중요해짐.
                // 그래서 withCredentials: true를 써서 "이 요청에는 쿠키도 같이 보내줘"라고 명시하는 것임.
                // 리뷰 추천은 보통 누가 눌렀는지를 알아야 함.
                // 로그인한 사용자인가/이 사용자가 이미 추천했나/추천 취소인가 새 추천인가 등등 알려면 서버가 요청 보낸 사용자를 알아야하고
                // 그걸 보통 세션 쿠키로 확인함.
            )

            const { liked, likeCount } = response.data

            setLikedReviewMap((prev) => ({
                ...prev,
                [reviewId]: liked,
            }))

            // 현재 보이는 카드의 숫자/버튼 상태만 바꾸고
            // 리뷰 목록 순서는 그대로 유지
            setReviewPageData((prev) => {
                if (!prev) return prev

                return {
                    ...prev,
                    reviews: prev.reviews.map((review) =>
                        review.reviewId === reviewId
                            ? {
                                ...review,
                                likeCount,
                            }
                            : review,
                    ),
                }
            })
        } catch (e) {
            if (axios.isAxiosError(e) && [401, 403].includes(e.response?.status ?? 0)) {
                alert('리뷰 추천은 로그인 후 이용해주세요.')
                return
            }

            alert('리뷰 추천 처리에 실패했습니다.')
        } finally {
            setReviewLikeLoadingMap((prev) => ({
                ...prev,
                [reviewId]: false,
            }))
        }
    }

    async function handleToggleInquiry(inquiry: ProductInquiryListItem) {
        if (!id) return

        if (openInquiryId === inquiry.id) {
            setOpenInquiryId(null)
            return
        }

        if (inquiryDetailMap[inquiry.id]) {
            setOpenInquiryId(inquiry.id)
            return
        }

        try {
            setInquiryDetailLoadingId(inquiry.id)
            setInquiryDetailErrorMap((prev) => {
                const next = { ...prev }
                delete next[inquiry.id]
                return next
            })

            const response = await axios.get(
                `${API_BASE_URL}/products/${id}/inquiries/${inquiry.id}`,
                {
                    withCredentials: true,
                },
            )

            setInquiryDetailMap((prev) => ({
                ...prev,
                [inquiry.id]: response.data,
            }))
            setOpenInquiryId(inquiry.id)
        } catch (e) {
            setInquiryDetailErrorMap((prev) => ({
                ...prev,
                [inquiry.id]: getInquiryDetailErrorMessage(e),
            }))
            setOpenInquiryId(inquiry.id)
        } finally {
            setInquiryDetailLoadingId(null)
        }
    }

    async function handleSubmitInquiry() {
        if (!id) return

        if (!inquiryForm.title.trim()) {
            setInquirySubmitError('문의 제목을 입력해주세요.')
            return
        }

        if (!inquiryForm.content.trim()) {
            setInquirySubmitError('문의 내용을 입력해주세요.')
            return
        }

        try {
            setInquirySubmitLoading(true)
            setInquirySubmitError('')

            if (editingInquiryId) {
                const editingInquiry = inquiries.find((inquiry) => inquiry.id === editingInquiryId)

                if (editingInquiry?.status === 'ANSWERED') {
                    setInquirySubmitError('관리자 답변이 완료된 문의는 수정할 수 없습니다.')
                    return
                }

                await axios.patch(
                    `${API_BASE_URL}/products/${id}/inquiries/${editingInquiryId}`,
                    {
                        title: inquiryForm.title,
                        content: inquiryForm.content,
                        secret: inquiryForm.secret,
                    },
                    {
                        withCredentials: true,
                    },
                )

                // 문의 목록 제목/비밀글 여부 즉시 반영
                setInquiries((prev) =>
                    prev.map((inquiry) =>
                        inquiry.id === editingInquiryId
                            ? {
                                ...inquiry,
                                title: inquiryForm.title,
                                secret: inquiryForm.secret,
                            }
                            : inquiry,
                    ),
                )

                // 이미 열어본 상세 캐시도 즉시 반영
                setInquiryDetailMap((prev) => {
                    const currentDetail = prev[editingInquiryId]
                    if (!currentDetail) return prev

                    return {
                        ...prev,
                        [editingInquiryId]: {
                            ...currentDetail,
                            title: inquiryForm.title,
                            content: inquiryForm.content,
                        },
                    }
                })
            } else {
                await axios.post(
                    `${API_BASE_URL}/products/${id}/inquiries`,
                    {
                        title: inquiryForm.title,
                        content: inquiryForm.content,
                        secret: inquiryForm.secret,
                    },
                    {
                        withCredentials: true,
                    },
                )

                await loadInquiries()
            }

            setInquiryForm({
                title: '',
                content: '',
                secret: false,
            })
            setShowInquiryForm(false)
            setEditingInquiryId(null)
            setViewMode('all')
            setCurrentPage(1)
        } catch (e) {
            setInquirySubmitError(
                getInquirySubmitErrorMessage(e, editingInquiryId ? 'edit' : 'create'),
            )
        } finally {
            setInquirySubmitLoading(false)
        }
    }

    function handleStartEditInquiry(inquiry: ProductInquiryListItem,
                                    detailItem: ProductInquiryDetailItem,
    ) {
        setEditingInquiryId(inquiry.id)
        setShowInquiryForm(true)
        setInquirySubmitError('')

        setInquiryForm({
            title: inquiry.title,
            content: detailItem.content ?? '',
            secret: inquiry.secret ?? false,
        })
    }

    async function handleDeleteInquiry(inquiryId: number) {
        if (!id) return

        const confirmed = window.confirm('문의글을 삭제할까요?')
        if (!confirmed) return

        try {
            await axios.delete(
                `${API_BASE_URL}/products/${id}/inquiries/${inquiryId}`,
                {
                    withCredentials: true,
                },
            )

            if (openInquiryId === inquiryId) {
                setOpenInquiryId(null)
            }

            setInquiryDetailMap((prev) => {
                const next = { ...prev }
                delete next[inquiryId]
                return next
            })

            await loadInquiries()
        } catch (e) {
            alert('문의 삭제에 실패했습니다.')
        }
    }

    if (loading) {
        return (
            <div style={pageStyle}>
                <SiteHeader />
                <div style={containerStyle}>
                    <PageState text="상품 상세를 불러오는 중입니다..." />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div style={pageStyle}>
                <SiteHeader />
                <div style={containerStyle}>
                    <PageState text={error} />
                </div>
            </div>
        )
    }

    if (!detail) {
        return (
            <div style={pageStyle}>
                <SiteHeader />
                <div style={containerStyle}>
                    <PageState text="상품 정보를 찾을 수 없습니다." />
                </div>
            </div>
        )
    }

    return (
        <div style={pageStyle}>
            <SiteHeader />
            <div style={containerStyle}>
                <div style={breadcrumbStyle}>
                    <Link to="/" style={breadcrumbLinkStyle}>
                        홈
                    </Link>
                    <span style={breadcrumbDividerStyle}>/</span>
                    <span>상품 상세</span>
                </div>

                <section style={heroSectionStyle}>
                    <div style={heroImageWrapStyle}>
                        <div style={heroImageStyle}>
                            <div style={heroImageBadgeStyle}>대표 이미지</div>
                            <div style={heroEmojiStyle}>{getEmoji(detail.name)}</div>
                        </div>
                    </div>

                    <div style={heroInfoStyle}>
                        <div style={statusBadgeStyle}>{getStatusLabel(detail.status)}</div>

                        <h1 style={titleStyle}>{detail.name}</h1>

                        <p style={shortDescriptionStyle}>{detail.description}</p>

                        <div style={priceBoxStyle}>
                            {reviewSummary && reviewSummary.totalCount > 0 && (
                                <div style={heroRatingRowStyle}>
                  <span style={heroRatingStarsStyle}>
                    {renderStars(Math.round(reviewSummary.averageRating))}
                  </span>
                                    <span style={heroRatingScoreStyle}>
                    {reviewSummary.averageRating.toFixed(1)}
                  </span>
                                    <span style={heroRatingCountStyle}>
                    총 {reviewSummary.totalCount.toLocaleString('ko-KR')}개
                  </span>
                                </div>
                            )}

                            <div style={saleOnlyLabelStyle}>판매가</div>
                            <div style={salePriceStyle}>{formatPrice(detail.price)}</div>
                        </div>

                        <div style={optionBoxStyle}>
                            <div style={optionTitleStyle}>구매 옵션</div>
                            <div style={optionPlaceholderStyle}>수량 선택 / 옵션 선택 영역 (추후 구현)</div>
                        </div>

                        <div style={buttonRowStyle}>
                            <button style={ghostButtonStyle}>공유</button>
                            <button style={ghostButtonStyle}>찜하기</button>
                            <button style={ghostButtonStyle}>장바구니</button>
                            <button style={primaryButtonStyle}>구매하기</button>
                        </div>
                    </div>
                </section>

                <div style={tabWrapStyle}>
                    <div style={tabHeaderStyle}>
                        <button
                            style={activeTab === 'detail' ? activeTabStyle : tabStyle}
                            onClick={() => handleTabChange('detail')}
                        >
                            상세정보
                        </button>

                        <button
                            style={activeTab === 'review' ? activeTabStyle : tabStyle}
                            onClick={() => handleTabChange('review')}
                        >
                            상품후기
                        </button>

                        <button
                            style={activeTab === 'inquiry' ? activeTabStyle : tabStyle}
                            onClick={() => handleTabChange('inquiry')}
                        >
                            상품문의
                        </button>
                    </div>

                    {activeTab === 'detail' && (
                        <div style={detailContentWrapStyle}>
                            <div style={placeholderImageBoxStyle}>
                                <div style={placeholderImageTitleStyle}>상세 설명 이미지</div>
                                <div style={placeholderImageSubTitleStyle}>
                                    리팩토링 전까지 임시 플레이스홀더
                                </div>
                            </div>

                            <div style={detailTextBoxStyle}>
                                <h2 style={detailSectionTitleStyle}>상품 설명</h2>
                                <p style={detailTextStyle}>{detail.description}</p>
                                <p style={detailTextStyle}>
                                    현재는 긴 설명 이미지를 아직 붙이지 않은 상태라, 실제 상세 이미지가 있는 것처럼
                                    보이도록 임시 플레이스홀더 박스를 넣어두었습니다.
                                </p>
                                <p style={detailTextStyle}>
                                    이후 리팩토링 단계에서 실제 상세 이미지 파일 또는 이미지 URL을 연결할 예정입니다.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'review' && (
                        <div style={detailContentWrapStyle}>
                            <div style={detailTextBoxStyle}>
                                <h2 style={detailSectionTitleStyle}>상품 리뷰</h2>

                                {reviewsLoading ? (
                                    <div style={stateBoxStyle}>상품후기를 불러오는 중입니다...</div>
                                ) : reviewsError ? (
                                    <div style={stateBoxStyle}>{reviewsError}</div>
                                ) : !reviewSummary ? (
                                    <div style={stateBoxStyle}>리뷰 정보를 불러오지 못했습니다.</div>
                                ) : (
                                    <div style={reviewSectionWrapStyle}>
                                        <div style={reviewSummaryBoxStyle}>
                                            <div style={reviewAverageRowStyle}>
                                                <div style={reviewAverageStarsStyle}>
                                                    {renderStars(Math.round(reviewSummary.averageRating))}
                                                </div>
                                                <div style={reviewAverageScoreStyle}>
                                                    {reviewSummary.averageRating.toFixed(1)}
                                                </div>
                                            </div>

                                            <div style={reviewTotalCountStyle}>
                                                총 {reviewSummary.totalCount.toLocaleString('ko-KR')}개
                                            </div>

                                            <div style={reviewRatingRowsStyle}>
                                                <ReviewRatingRow label="최고" percent={fiveStarPercent} />
                                                <ReviewRatingRow label="좋음" percent={fourStarPercent} />
                                                <ReviewRatingRow label="보통" percent={threeStarPercent} />
                                                <ReviewRatingRow label="별로" percent={twoStarPercent} />
                                                <ReviewRatingRow label="나쁨" percent={oneStarPercent} />
                                            </div>
                                        </div>

                                        <div style={reviewListAreaStyle}>
                                            <div style={reviewTopControlRowStyle}>
                                                <div style={reviewSortButtonGroupStyle}>
                                                    <button
                                                        style={reviewSort === 'BEST' ? activeSortButtonStyle : sortButtonStyle}
                                                        onClick={() => setReviewSort('BEST')}
                                                    >
                                                        베스트순
                                                    </button>

                                                    <button
                                                        style={reviewSort === 'LATEST' ? activeSortButtonStyle : sortButtonStyle}
                                                        onClick={() => setReviewSort('LATEST')}
                                                    >
                                                        최신순
                                                    </button>
                                                </div>

                                                <select
                                                    value={reviewRatingFilter === 'ALL' ? 'ALL' : String(reviewRatingFilter)}
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        setReviewRatingFilter(value === 'ALL' ? 'ALL' : Number(value))
                                                    }}
                                                    style={reviewFilterSelectStyle}
                                                >
                                                    <option value="ALL">모든 별점</option>
                                                    <option value="5">최고</option>
                                                    <option value="4">좋음</option>
                                                    <option value="3">보통</option>
                                                    <option value="2">별로</option>
                                                    <option value="1">나쁨</option>
                                                </select>
                                            </div>

                                            {reviewItems.length === 0 ? (
                                                <div style={stateBoxStyle}>등록된 상품후기가 없습니다.</div>
                                            ) : (
                                                <>
                                                    <div style={reviewCardListStyle}>
                                                        {reviewItems.map((review) => (
                                                            <div key={review.reviewId} style={reviewCardStyle}>
                                                                <div style={reviewTopMetaBlockStyle}>
                                                                    <div style={reviewWriterStyle}>
                                                                        {getWriterLabel(review)}
                                                                    </div>

                                                                    <div style={reviewMetaInlineRowStyle}>
                                    <span style={reviewStarsStyle}>
                                      {renderStars(review.rating)}
                                    </span>
                                                                        <span style={reviewDateStyle}>
                                      {formatReviewDate(review.createdAt)}
                                    </span>

                                                                        {(review.productNameSnapshot || review.quantity) && (
                                                                            <span style={reviewPurchaseInfoStyle}>
                                        {review.productNameSnapshot ?? ''}
                                                                                {review.quantity ? `, ${review.quantity}개` : ''}
                                      </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div style={reviewTitleStyle}>{review.title}</div>

                                                                <div style={reviewContentStyle}>{review.content}</div>

                                                                <div style={reviewHelpRowStyle}>
                                                                    <button
                                                                        style={
                                                                            likedReviewMap[review.reviewId]
                                                                                ? activeReviewHelpButtonStyle
                                                                                : reviewHelpButtonStyle
                                                                        }
                                                                        onClick={() => handleToggleReviewLike(review.reviewId)}
                                                                        disabled={!!reviewLikeLoadingMap[review.reviewId]}
                                                                    >
                                                                        {reviewLikeLoadingMap[review.reviewId]
                                                                            ? '처리 중...'
                                                                            : getReviewLikeLabel(review.likeCount ?? 0)}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {reviewTotalPages > 1 && (
                                                        <div style={paginationWrapStyle}>
                                                            <button
                                                                style={paginationArrowButtonStyle}
                                                                onClick={() => setReviewPage((prev) => Math.max(0, prev - 1))}
                                                                disabled={!reviewHasPrevious}
                                                            >
                                                                {'<'}
                                                            </button>

                                                            {Array.from({ length: reviewTotalPages }, (_, index) => index).map(
                                                                (pageNumber) => (
                                                                    <button
                                                                        key={pageNumber}
                                                                        style={
                                                                            pageNumber === reviewPage
                                                                                ? activePageButtonStyle
                                                                                : pageButtonStyle
                                                                        }
                                                                        onClick={() => setReviewPage(pageNumber)}
                                                                    >
                                                                        {pageNumber + 1}
                                                                    </button>
                                                                ),
                                                            )}

                                                            <button
                                                                style={paginationArrowButtonStyle}
                                                                onClick={() =>
                                                                    setReviewPage((prev) => Math.min(reviewTotalPages - 1, prev + 1))
                                                                }
                                                                disabled={!reviewHasNext}
                                                            >
                                                                {'>'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'inquiry' && (
                        <div style={detailContentWrapStyle}>
                            <div style={detailTextBoxStyle}>
                                <h2 style={detailSectionTitleStyle}>상품문의</h2>

                                <div style={inquiryGuideBoxStyle}>
                                    <ul style={inquiryGuideListStyle}>
                                        <li>구매한 상품의 취소/반품은 구매내역에서 신청 가능합니다.</li>
                                        <li>상품문의 및 후기게시판을 통해 취소나 환불, 반품 등은 처리되지 않습니다.</li>
                                        <li>
                                            가격, 판매자, 교환/환불 및 배송 등 해당 상품 자체와 관련 없는 문의는 고객센터를
                                            이용해주세요.
                                        </li>
                                        <li>개인정보는 공개 게시판에 남기지 않도록 주의해주세요.</li>
                                    </ul>
                                </div>

                                <div style={inquiryTopControlRowStyle}>
                                    <button
                                        style={inquiryWriteButtonStyle}
                                        onClick={() => {
                                            if (!currentMember) {
                                                moveToLoginPage()
                                                return
                                            }

                                            setShowInquiryForm(true)
                                        }}
                                    >
                                        문의하기
                                    </button>

                                    <div style={inquiryFilterButtonGroupStyle}>
                                        <button
                                            style={viewMode === 'mine' ? activeSmallButtonStyle : smallButtonStyle}
                                            onClick={() => {
                                                if (!currentMember) {
                                                    moveToLoginPage()
                                                    return
                                                }

                                                setViewMode('mine')
                                                setCurrentPage(1)
                                            }}
                                        >
                                            내 문의보기
                                        </button>

                                        <button
                                            style={viewMode === 'all' ? activeSmallButtonStyle : smallButtonStyle}
                                            onClick={() => {
                                                setViewMode('all')
                                                setCurrentPage(1)
                                            }}
                                        >
                                            전체 문의보기
                                        </button>
                                    </div>
                                </div>

                                {!currentMember && (
                                    <div style={inquirySubNoticeStyle}>
                                        내 문의보기와 문의 작성은 로그인 상태에서 사용할 수 있습니다.
                                    </div>
                                )}

                                {showInquiryForm && (
                                    <div style={inquiryFormWrapStyle}>
                                        <div style={inquiryFormTitleStyle}>
                                            {editingInquiryId ? '상품문의 수정' : '상품문의 작성'}
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="문의 제목을 입력해주세요."
                                            value={inquiryForm.title}
                                            onChange={(e) =>
                                                setInquiryForm((prev) => ({
                                                    ...prev,
                                                    title: e.target.value,
                                                }))
                                            }
                                            style={inquiryInputStyle}
                                        />

                                        <textarea
                                            placeholder="문의 내용을 입력해주세요."
                                            value={inquiryForm.content}
                                            onChange={(e) =>
                                                setInquiryForm((prev) => ({
                                                    ...prev,
                                                    content: e.target.value,
                                                }))
                                            }
                                            style={inquiryTextareaStyle}
                                        />

                                        <label style={secretCheckLabelStyle}>
                                            <input
                                                type="checkbox"
                                                checked={inquiryForm.secret}
                                                onChange={(e) =>
                                                    setInquiryForm((prev) => ({
                                                        ...prev,
                                                        secret: e.target.checked,
                                                    }))
                                                }
                                            />
                                            <span>비밀글로 작성하기</span>
                                        </label>

                                        {inquirySubmitError && (
                                            <div style={inquirySubmitErrorStyle}>{inquirySubmitError}</div>
                                        )}

                                        <div style={inquiryFormButtonRowStyle}>
                                            <button
                                                style={inquiryFormCancelButtonStyle}
                                                onClick={() => {
                                                    setShowInquiryForm(false)
                                                    setInquirySubmitError('')
                                                    setEditingInquiryId(null)
                                                }}
                                                disabled={inquirySubmitLoading}
                                            >
                                                취소
                                            </button>

                                            <button
                                                style={inquiryFormSubmitButtonStyle}
                                                onClick={handleSubmitInquiry}
                                                disabled={inquirySubmitLoading}
                                            >
                                                {inquirySubmitLoading
                                                    ? editingInquiryId
                                                        ? '수정 중...'
                                                        : '등록 중...'
                                                    : editingInquiryId
                                                        ? '수정'
                                                        : '등록'
                                                }
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {inquiriesLoading ? (
                                    <div style={stateBoxStyle}>상품문의를 불러오는 중입니다...</div>
                                ) : inquiriesError ? (
                                    <div style={stateBoxStyle}>{inquiriesError}</div>
                                ) : filteredInquiries.length === 0 ? (
                                    <div style={stateBoxStyle}>
                                        {viewMode === 'mine'
                                            ? '내가 작성한 상품문의가 없습니다.'
                                            : '등록된 상품문의가 없습니다.'}
                                    </div>
                                ) : (
                                    <>
                                        <div style={inquiryListStyle}>
                                            {pagedInquiries.map((inquiry) => {
                                                const isOpen = openInquiryId === inquiry.id
                                                const detailItem = inquiryDetailMap[inquiry.id]
                                                const detailError = inquiryDetailErrorMap[inquiry.id]
                                                const isDetailLoading = inquiryDetailLoadingId === inquiry.id
                                                const isSecret = isSecretInquiry(inquiry)

                                                return (
                                                    <div key={inquiry.id} style={inquiryCardStyle}>
                                                        <div style={inquiryCardHeaderStyle}>
                                                            <div style={inquiryCardHeaderLeftStyle}>
                                                                <div style={inquiryTopRowStyle}>
                                  <span
                                      style={{
                                          ...inquiryStatusBadgeStyle,
                                          backgroundColor:
                                              inquiry.status === 'ANSWERED' ? '#dbeafe' : '#f3f4f6',
                                          color:
                                              inquiry.status === 'ANSWERED' ? '#1d4ed8' : '#374151',
                                      }}
                                  >
                                    {getInquiryStatusLabel(inquiry.status)}
                                  </span>

                                                                    <strong style={inquiryTitleStyle}>
                                                                        {isSecret ? '🔒 비밀문의입니다.' : inquiry.title}
                                                                    </strong>
                                                                </div>

                                                                <div style={inquiryMetaStyle}>
                                                                    <span>{getWriterLabel(inquiry)}</span>
                                                                    <span>·</span>
                                                                    <span>{formatInquiryDate(inquiry.createdAt)}</span>
                                                                </div>
                                                            </div>

                                                            {!isSecret && (
                                                                <button
                                                                    style={arrowButtonStyle}
                                                                    onClick={() => handleToggleInquiry(inquiry)}
                                                                >
                                                                    {isOpen ? '▲' : '▼'}
                                                                </button>
                                                            )}
                                                        </div>

                                                        {isOpen && (
                                                            <div style={inquiryDetailBoxStyle}>
                                                                {isDetailLoading ? (
                                                                    <div style={inquiryDetailTextStyle}>
                                                                        문의 내용을 불러오는 중입니다...
                                                                    </div>
                                                                ) : detailError ? (
                                                                    <div style={inquiryDetailErrorStyle}>{detailError}</div>
                                                                ) : detailItem ? (
                                                                    <>
                                                                        <div style={inquiryDetailSectionStyle}>
                                                                            <div style={inquiryDetailLabelStyle}>문의 내용</div>
                                                                            <div style={inquiryDetailTextStyle}>{detailItem.content}</div>
                                                                        </div>

                                                                        {detailItem.answerContent && (
                                                                            <div style={inquiryAnswerSectionStyle}>
                                                                                <div style={inquiryDetailLabelStyle}>답변 내용</div>
                                                                                <div style={inquiryDetailTextStyle}>
                                                                                    {detailItem.answerContent}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {isMyInquiry(inquiry) && (
                                                                            <div style={inquiryActionRowStyle}>
                                                                                <button
                                                                                    type="button"
                                                                                    style={inquiryTextActionButtonStyle}
                                                                                    onClick={() => {
                                                                                        if (!detailItem) return
                                                                                        handleStartEditInquiry(inquiry, detailItem)
                                                                                    }}
                                                                                >
                                                                                    수정
                                                                                </button>

                                                                                <button
                                                                                    type="button"
                                                                                    style={inquiryTextActionButtonStyle}
                                                                                    onClick={() => handleDeleteInquiry(inquiry.id)}
                                                                                >
                                                                                    삭제
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <div style={inquiryDetailTextStyle}>
                                                                        문의 내용을 불러오지 못했습니다.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {totalPages > 1 && (
                                            <div style={paginationWrapStyle}>
                                                <button
                                                    style={paginationArrowButtonStyle}
                                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                                    disabled={currentPage === 1}
                                                >
                                                    {'<'}
                                                </button>

                                                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                                                    (page) => (
                                                        <button
                                                            key={page}
                                                            style={page === currentPage ? activePageButtonStyle : pageButtonStyle}
                                                            onClick={() => setCurrentPage(page)}
                                                        >
                                                            {page}
                                                        </button>
                                                    ),
                                                )}

                                                <button
                                                    style={paginationArrowButtonStyle}
                                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                                    disabled={currentPage === totalPages}
                                                >
                                                    {'>'}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// 인라인 스타일(Inline Styles) 정의
// 현재 수정이 많고 상태 변화가 많아서 그냥 tsx 안에두고 수정
// 추후 .css로 빼서 다른 것들과 스타일링 방식 통일해주기.

const pageStyle = {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    color: '#111827',
} as const

const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px 96px',
} as const

const breadcrumbStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '22px',
    color: '#6b7280',
    fontSize: '14px',
} as const

const breadcrumbLinkStyle = {
    color: '#6b7280',
    textDecoration: 'none',
} as const

const breadcrumbDividerStyle = {
    color: '#d1d5db',
} as const

const heroSectionStyle = {
    display: 'grid',
    gridTemplateColumns: '1.05fr 1fr',
    gap: '28px',
    alignItems: 'start',
} as const

const heroImageWrapStyle = {
    width: '100%',
} as const

const heroImageStyle = {
    position: 'relative',
    minHeight: '540px',
    border: '1px solid #ececec',
    borderRadius: '28px',
    background: 'linear-gradient(135deg, #fff8dc 0%, #f3f4f6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
} as const

const heroImageBadgeStyle = {
    position: 'absolute',
    top: '18px',
    left: '18px',
    borderRadius: '999px',
    backgroundColor: '#fff6cc',
    color: '#9a6b00',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 800,
    border: '1px solid #f1c84b',
} as const

const heroEmojiStyle = {
    fontSize: '120px',
} as const

const heroInfoStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'stretch',
} as const

const statusBadgeStyle = {
    alignSelf: 'flex-start',
    borderRadius: '999px',
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 800,
} as const

const titleStyle = {
    margin: 0,
    fontSize: '46px',
    fontWeight: 900,
    lineHeight: 1.18,
    letterSpacing: '-0.04em',
    wordBreak: 'keep-all',
    textAlign: 'left',
} as const

const shortDescriptionStyle = {
    margin: 0,
    color: '#9ca3af',
    fontSize: '18px',
    lineHeight: 1.6,
    textAlign: 'left',
} as const

const priceBoxStyle = {
    width: '100%',
    border: 'none',
    borderRadius: '22px',
    padding: '20px 24px',
    backgroundColor: '#f9fafb',
    boxSizing: 'border-box',
    textAlign: 'left',
} as const

const saleOnlyLabelStyle = {
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: 700,
    marginBottom: '6px',
    textAlign: 'left',
} as const

const salePriceStyle = {
    color: '#111827',
    fontSize: '44px',
    fontWeight: 900,
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
    textAlign: 'left',
} as const

const optionBoxStyle = {
    width: '100%',
    border: '1px solid #ececec',
    borderRadius: '20px',
    padding: '22px 24px',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
} as const

const optionTitleStyle = {
    fontSize: '16px',
    fontWeight: 800,
    marginBottom: '12px',
    textAlign: 'left',
} as const

const optionPlaceholderStyle = {
    border: '1px dashed #d1d5db',
    borderRadius: '14px',
    padding: '18px 16px',
    color: '#6b7280',
    fontSize: '15px',
    textAlign: 'center',
} as const

const buttonRowStyle = {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1.2fr 1.4fr',
    gap: '12px',
    boxSizing: 'border-box',
} as const

const ghostButtonStyle = {
    height: '52px',
    borderRadius: '14px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#111827',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
} as const

const primaryButtonStyle = {
    height: '52px',
    borderRadius: '14px',
    border: 'none',
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 800,
    cursor: 'pointer',
} as const

const tabWrapStyle = {
    marginTop: '48px',
} as const

const tabHeaderStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
    marginBottom: '24px',
} as const

const activeTabStyle = {
    height: '52px',
    borderRadius: '14px',
    border: '1px solid #111827',
    backgroundColor: '#111827',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
} as const

const tabStyle = {
    height: '52px',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    color: '#6b7280',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
} as const

const detailContentWrapStyle = {
    display: 'grid',
    gap: '24px',
} as const

const placeholderImageBoxStyle = {
    minHeight: '420px',
    borderRadius: '24px',
    border: '1px dashed #d1d5db',
    background: 'linear-gradient(180deg, #f9fafb 0%, #fffdf4 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
} as const

const placeholderImageTitleStyle = {
    color: '#111827',
    fontSize: '28px',
    fontWeight: 900,
} as const

const placeholderImageSubTitleStyle = {
    color: '#6b7280',
    fontSize: '16px',
} as const

const detailTextBoxStyle = {
    borderRadius: '24px',
    border: '1px solid #ececec',
    padding: '32px',
    backgroundColor: '#ffffff',
} as const

const detailSectionTitleStyle = {
    margin: '0 0 18px',
    fontSize: '24px',
    fontWeight: 900,
} as const

const detailTextStyle = {
    margin: '0 0 14px',
    color: '#374151',
    fontSize: '17px',
    lineHeight: 1.9,
    whiteSpace: 'pre-wrap',
} as const

const inquiryGuideBoxStyle = {
    border: '1px solid #ececec',
    borderRadius: '18px',
    padding: '18px 20px',
    backgroundColor: '#f9fafb',
    marginBottom: '20px',
    textAlign: 'left',
} as const

const inquiryGuideListStyle = {
    margin: 0,
    paddingLeft: '20px',
    color: '#4b5563',
    fontSize: '14px',
    lineHeight: 1.8,
    textAlign: 'left',
} as const

const inquiryTopControlRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '12px',
} as const

const inquiryWriteButtonStyle = {
    minWidth: '112px',
    height: '44px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#9ca3af',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 800,
    cursor: 'pointer',
    padding: '0 16px',
} as const

const inquiryFilterButtonGroupStyle = {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
} as const

const smallButtonStyle = {
    minWidth: '108px',
    height: '40px',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: '0 14px',
} as const

const activeSmallButtonStyle = {
    minWidth: '108px',
    height: '40px',
    borderRadius: '12px',
    border: '1px solid #111827',
    backgroundColor: '#111827',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: '0 14px',
} as const

const inquirySubNoticeStyle = {
    marginBottom: '16px',
    color: '#6b7280',
    fontSize: '13px',
} as const

const inquiryFormWrapStyle = {
    border: '1px solid #ececec',
    borderRadius: '18px',
    backgroundColor: '#f9fafb',
    padding: '18px 20px',
    marginBottom: '20px',
    display: 'grid',
    gap: '8px',
} as const

const inquiryFormTitleStyle = {
    fontSize: '18px',
    fontWeight: 800,
    color: '#111827',
} as const

const inquiryInputStyle = {
    width: '100%',
    height: '46px',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    padding: '0 14px',
    fontSize: '14px',
    boxSizing: 'border-box',
} as const

const inquiryTextareaStyle = {
    width: '100%',
    minHeight: '150px',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    padding: '14px',
    fontSize: '14px',
    lineHeight: 1.7,
    resize: 'vertical',
    boxSizing: 'border-box',
} as const

const secretCheckLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
    marginTop: '2px',
} as const

const inquiryFormButtonRowStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '2px',
} as const

const inquiryFormCancelButtonStyle = {
    minWidth: '72px',
    height: '38px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#111827',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: '0 14px',
} as const

const inquiryFormSubmitButtonStyle = {
    minWidth: '72px',
    height: '38px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: '0 14px',
} as const

const inquirySubmitErrorStyle = {
    color: '#dc2626',
    fontSize: '13px',
    fontWeight: 600,
    lineHeight: 1.4,
    marginTop: '2px',
} as const

const inquiryListStyle = {
    display: 'grid',
    gap: '16px',
} as const

const inquiryCardStyle = {
    border: '1px solid #ececec',
    borderRadius: '16px',
    padding: '18px 20px',
    backgroundColor: '#ffffff',
} as const

const inquiryCardHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
} as const

const inquiryCardHeaderLeftStyle = {
    flex: 1,
    minWidth: 0,
} as const

const inquiryTopRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
    flexWrap: 'wrap',
} as const

const inquiryStatusBadgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '74px',
    height: '28px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 800,
    padding: '0 12px',
} as const

const inquiryTitleStyle = {
    fontSize: '16px',
    color: '#111827',
} as const

const inquiryMetaStyle = {
    color: '#6b7280',
    fontSize: '14px',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
} as const

const arrowButtonStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '999px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '14px',
    fontWeight: 800,
    cursor: 'pointer',
    flexShrink: 0,
} as const

const inquiryDetailBoxStyle = {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #ececec',
    display: 'grid',
    gap: '14px',
    textAlign: 'left',
} as const

const inquiryDetailSectionStyle = {
    display: 'grid',
    gap: '6px',
    textAlign: 'left',
} as const

const inquiryAnswerSectionStyle = {
    display: 'grid',
    gap: '6px',
    padding: '14px 16px',
    borderRadius: '14px',
    backgroundColor: '#f9fafb',
    textAlign: 'left',
} as const

const inquiryDetailLabelStyle = {
    fontSize: '13px',
    fontWeight: 800,
    color: '#6b7280',
    textAlign: 'left',
} as const

const inquiryDetailTextStyle = {
    color: '#111827',
    fontSize: '15px',
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap',
    textAlign: 'left',
} as const

const inquiryDetailErrorStyle = {
    color: '#dc2626',
    fontSize: '14px',
    lineHeight: 1.7,
    textAlign: 'left',
} as const

const paginationWrapStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
    flexWrap: 'wrap',
} as const

const paginationArrowButtonStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontWeight: 700,
    cursor: 'pointer',
} as const

const pageButtonStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontWeight: 700,
    cursor: 'pointer',
} as const

const activePageButtonStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: '1px solid #2563eb',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontWeight: 800,
    cursor: 'pointer',
} as const

const stateBoxStyle = {
    border: '1px solid #ececec',
    borderRadius: '24px',
    padding: '80px 24px',
    textAlign: 'center',
    color: '#6b7280',
    backgroundColor: '#ffffff',
    fontSize: '16px',
} as const

const reviewSectionWrapStyle = {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '28px',
    alignItems: 'start',
} as const

const reviewSummaryBoxStyle = {
    border: '1px solid #ececec',
    borderRadius: '18px',
    padding: '20px',
    backgroundColor: '#ffffff',
} as const

const reviewAverageRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '10px',
} as const

const reviewAverageStarsStyle = {
    color: '#f59e0b',
    fontSize: '22px',
    fontWeight: 700,
} as const

const reviewAverageScoreStyle = {
    fontSize: '34px',
    fontWeight: 900,
    color: '#111827',
} as const

const reviewTotalCountStyle = {
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: 700,
    marginBottom: '20px',
} as const

const reviewRatingRowsStyle = {
    display: 'grid',
    gap: '10px',
} as const

const reviewRatingRowStyle = {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 46px',
    alignItems: 'center',
    gap: '10px',
} as const

const reviewRatingLabelStyle = {
    color: '#374151',
    fontSize: '13px',
    fontWeight: 700,
} as const

const reviewBarTrackStyle = {
    width: '100%',
    height: '8px',
    borderRadius: '999px',
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
} as const

const reviewBarFillStyle = {
    height: '100%',
    borderRadius: '999px',
    backgroundColor: '#f59e0b',
} as const

const reviewRatingPercentStyle = {
    color: '#374151',
    fontSize: '13px',
    fontWeight: 700,
    textAlign: 'right',
} as const

const reviewListAreaStyle = {
    display: 'grid',
    gap: '18px',
} as const

const reviewTopControlRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
} as const

const reviewSortButtonGroupStyle = {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
} as const

const sortButtonStyle = {
    minWidth: '92px',
    height: '38px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: '0 14px',
} as const

const activeSortButtonStyle = {
    minWidth: '92px',
    height: '38px',
    borderRadius: '10px',
    border: '1px solid #2563eb',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontSize: '14px',
    fontWeight: 800,
    cursor: 'pointer',
    padding: '0 14px',
} as const

const reviewFilterSelectStyle = {
    minWidth: '140px',
    height: '40px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#111827',
    fontSize: '14px',
    padding: '0 12px',
} as const

const reviewCardListStyle = {
    display: 'grid',
    gap: '16px',
} as const

const reviewCardStyle = {
    borderTop: '1px solid #ececec',
    paddingTop: '18px',
    paddingBottom: '12px',
    display: 'grid',
    gap: '10px',
    textAlign: 'left',
    justifyItems: 'start',
} as const

const reviewWriterStyle = {
    color: '#111827',
    fontSize: '16px',
    fontWeight: 800,
    textAlign: 'left',
} as const

const reviewStarsStyle = {
    color: '#f59e0b',
    fontSize: '15px',
    fontWeight: 700,
} as const

const reviewDateStyle = {
    color: '#9ca3af',
    fontSize: '14px',
} as const

const reviewPurchaseInfoStyle = {
    color: '#9ca3af',
    fontSize: '14px',
    textAlign: 'left',
} as const

const reviewTitleStyle = {
    color: '#111827',
    fontSize: '18px',
    fontWeight: 800,
    marginTop: '2px',
    textAlign: 'left',
} as const

const reviewContentStyle = {
    color: '#374151',
    fontSize: '15px',
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap',
    textAlign: 'left',
} as const

const reviewHelpRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '4px',
    justifyContent: 'flex-start',
} as const

const reviewHelpButtonStyle = {
    height: '36px',
    borderRadius: '8px',
    border: '1px solid #bfdbfe',
    backgroundColor: '#ffffff',
    color: '#2563eb',
    fontSize: '13px',
    fontWeight: 700,
    padding: '0 12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    whiteSpace: 'nowrap',
} as const

const activeReviewHelpButtonStyle = {
    height: '36px',
    borderRadius: '8px',
    border: '1px solid #2563eb',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 700,
    padding: '0 12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    whiteSpace: 'nowrap',
} as const

const reviewTopMetaBlockStyle = {
    display: 'grid',
    gap: '6px',
    width: '100%',
    textAlign: 'left',
    justifyItems: 'start',
} as const

const reviewMetaInlineRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    width: '100%',
} as const

const heroRatingRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '14px',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
} as const

const heroRatingStarsStyle = {
    color: '#f59e0b',
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: 1,
} as const

const heroRatingScoreStyle = {
    color: '#111827',
    fontSize: '18px',
    fontWeight: 800,
} as const

const heroRatingCountStyle = {
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: 700,
} as const

const inquiryActionRowStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '14px',
    marginTop: '12px',
} as const

const inquiryTextActionButtonStyle = {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
} as const