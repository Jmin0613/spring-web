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

import { Link, useParams } from 'react-router-dom'
// 페이지 이동(라우팅) 담당하는 별도의 라이브러리 도구들

type ProductDetail = {
    id: number
    category: string
    imageUrl: string | null
    name: string
    description: string
    price: number
    status: string
}

type ReviewSortType = 'BEST' | 'LATEST'

type ReviewSummary = {
    averageRating: number
    totalCount: number
    fiveStarCount: number
    fourStarCount: number
    threeStarCount: number
    twoStarCount: number
    oneStarCount: number
}

type ProductReviewItem = {
    reviewId: number
    writerNickName?: string
    rating: number
    title: string
    content: string
    createdAt: string
    likeCount?: number
    productNameSnapshot?: string
    quantity?: number
}

type ReviewPageResponse = {
    summary: ReviewSummary
    reviews: ProductReviewItem[]
    page: number
    size: number
    totalElements: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
}

type ReviewLikeToggleResponse = {
    reviewId: number
    liked: boolean
    likeCount: number
}

type ProductInquiryListItem = {
    id: number
    title: string
    writerNickName?: string
    writerId?: number
    status: 'WAITING' | 'ANSWERED'
    createdAt: string
    secret?: boolean
}

type ProductInquiryDetailItem = {
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

type MemberInfo = {
    id: number
    nickname?: string
    name?: string
}

const API_BASE_URL = 'http://localhost:8080'
const PAGE_SIZE = 10

function formatPrice(price: number) {
    return `${price.toLocaleString('ko-KR')}원`
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
}

function getEmoji(name: string) {
    if (name.includes('강아지')) return '🐶'
    if (name.includes('고양이')) return '🐱'
    if (name.includes('비타민')) return '💊'
    if (name.includes('노트북')) return '💻'
    return '🛍️'
}

function formatReviewDate(dateTime: string) {
    return dateTime.slice(0, 10).replaceAll('-', '.')
}

function renderStars(rating: number) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

function getRatingPercent(count: number, total: number) {
    if (total === 0) return 0
    return Math.round((count / total) * 100)
}

function getReviewLikeLabel(likeCount: number) {
    if (likeCount <= 0) {
        return '도움이 돼요'
    }

    return `${likeCount}명에게 도움이 됐어요`
}

function ReviewRatingRow({
                             label,
                             percent,
                         }: {
    label: string
    percent: number
}) {
    return (
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


function getWriterLabel(inquiry: ProductInquiryListItem | ProductInquiryDetailItem) {
    return inquiry.writerNickName ?? '알 수 없음'
}

function getCurrentMemberLabel(member: MemberInfo | null) {
    if (!member) return ''
    return member.nickname ?? member.name ?? ''
}

function isSecretInquiry(inquiry: ProductInquiryListItem) {
    return inquiry.secret === true
}

function getInquirySubmitErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const responseData = error.response?.data

        if (status === 401 || status === 403) {
            return '문의 작성은 로그인 후 이용해주세요.'
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

    return '문의 등록에 실패했습니다.'
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

export default function ProductDetailPage() {
    const { id } = useParams()

    const [detail, setDetail] = useState<ProductDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [activeTab, setActiveTab] = useState<'detail' | 'review' | 'inquiry'>('detail')

    const [reviewSort, setReviewSort] = useState<ReviewSortType>('BEST')
    const [reviewRatingFilter, setReviewRatingFilter] = useState<number | 'ALL'>('ALL')
    const [reviewPage, setReviewPage] = useState(0)

    const [reviewPageData, setReviewPageData] = useState<ReviewPageResponse | null>(null)
    const [reviewsLoading, setReviewsLoading] = useState(false)
    const [reviewsError, setReviewsError] = useState('')

    const [likedReviewMap, setLikedReviewMap] = useState<Record<number, boolean>>({})
    const [reviewLikeLoadingMap, setReviewLikeLoadingMap] = useState<Record<number, boolean>>({})

    const [inquiries, setInquiries] = useState<ProductInquiryListItem[]>([])
    const [inquiriesLoading, setInquiriesLoading] = useState(true)
    const [inquiriesError, setInquiriesError] = useState('')

    const [openInquiryId, setOpenInquiryId] = useState<number | null>(null)
    const [inquiryDetailMap, setInquiryDetailMap] = useState<Record<number, ProductInquiryDetailItem>>({})
    const [inquiryDetailLoadingId, setInquiryDetailLoadingId] = useState<number | null>(null)
    const [inquiryDetailErrorMap, setInquiryDetailErrorMap] = useState<Record<number, string>>({})

    const [currentMember, setCurrentMember] = useState<MemberInfo | null>(null)

    const [viewMode, setViewMode] = useState<'all' | 'mine'>('all')
    const [currentPage, setCurrentPage] = useState(1)

    const [showInquiryForm, setShowInquiryForm] = useState(false)
    const [inquiryForm, setInquiryForm] = useState({
        title: '',
        content: '',
        secret: false,
    })
    const [inquirySubmitLoading, setInquirySubmitLoading] = useState(false)
    const [inquirySubmitError, setInquirySubmitError] = useState('')

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
                { params },
            )

            setReviewPageData(response.data)
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
            setCurrentMember(response.data)
        } catch (e) {
            setCurrentMember(null)
        }
    }

    useEffect(() => {
        loadProductDetail()
    }, [id])

    useEffect(() => {
        loadReviews()
    }, [id, reviewSort, reviewRatingFilter, reviewPage])

    useEffect(() => {
        setReviewPage(0)
    }, [reviewSort, reviewRatingFilter])

    useEffect(() => {
        loadInquiries()
    }, [id])

    useEffect(() => {
        loadMyInfo()
    }, [])

    const currentMemberLabel = getCurrentMemberLabel(currentMember)

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
        if (currentMember?.id && inquiry.writerId) {
            return inquiry.writerId === currentMember.id
        }

        if (!currentMemberLabel) {
            return false
        }

        return getWriterLabel(inquiry) === currentMemberLabel
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
                `${API_BASE_URL}/products/${id}/reviews/${reviewId}/like`,
                {},
                { withCredentials: true },
            )

            const { liked, likeCount } = response.data

            setLikedReviewMap((prev) => ({
                ...prev,
                [reviewId]: liked,
            }))

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

            setInquiryForm({
                title: '',
                content: '',
                secret: false,
            })
            setShowInquiryForm(false)
            setViewMode('all')
            setCurrentPage(1)
            await loadInquiries()
        } catch (e) {
            setInquirySubmitError(getInquirySubmitErrorMessage(e))
        } finally {
            setInquirySubmitLoading(false)
        }
    }

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={containerStyle}>
                    <PageState text="상품 상세를 불러오는 중입니다..." />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div style={pageStyle}>
                <div style={containerStyle}>
                    <PageState text={error} />
                </div>
            </div>
        )
    }

    if (!detail) {
        return (
            <div style={pageStyle}>
                <div style={containerStyle}>
                    <PageState text="상품 정보를 찾을 수 없습니다." />
                </div>
            </div>
        )
    }

    return (
        <div style={pageStyle}>
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

                        <h1 style={titleStyle}># {detail.name}</h1>

                        <p style={shortDescriptionStyle}>{detail.description}</p>

                        <div style={priceBoxStyle}>
                            <div style={saleOnlyLabelStyle}>판매가</div>
                            <div style={salePriceStyle}>{formatPrice(detail.price)}</div>
                            <div style={categoryTextStyle}>카테고리 · {detail.category}</div>
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
                            onClick={() => setActiveTab('detail')}
                        >
                            상세정보
                        </button>

                        <button
                            style={activeTab === 'review' ? activeTabStyle : tabStyle}
                            onClick={() => setActiveTab('review')}
                        >
                            상품후기
                        </button>

                        <button
                            style={activeTab === 'inquiry' ? activeTabStyle : tabStyle}
                            onClick={() => setActiveTab('inquiry')}
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
                                                                        {review.writerNickName ?? '알 수 없음'}
                                                                    </div>

                                                                    <div style={reviewMetaInlineRowStyle}>
                                                                        <span style={reviewStarsStyle}>{renderStars(review.rating)}</span>
                                                                        <span style={reviewDateStyle}>{formatReviewDate(review.createdAt)}</span>

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

                                                            {Array.from({ length: reviewTotalPages }, (_, index) => index).map((pageNumber) => (
                                                                <button
                                                                    key={pageNumber}
                                                                    style={pageNumber === reviewPage ? activePageButtonStyle : pageButtonStyle}
                                                                    onClick={() => setReviewPage(pageNumber)}
                                                                >
                                                                    {pageNumber + 1}
                                                                </button>
                                                            ))}

                                                            <button
                                                                style={paginationArrowButtonStyle}
                                                                onClick={() => setReviewPage((prev) => Math.min(reviewTotalPages - 1, prev + 1))}
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
                                        onClick={() => setShowInquiryForm(true)}
                                    >
                                        문의하기
                                    </button>

                                    <div style={inquiryFilterButtonGroupStyle}>
                                        <button
                                            style={viewMode === 'mine' ? activeSmallButtonStyle : smallButtonStyle}
                                            onClick={() => {
                                                setViewMode('mine')
                                                setCurrentPage(1)
                                            }}
                                            disabled={!currentMember}
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
                                        <div style={inquiryFormTitleStyle}>상품문의 작성</div>

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
                                                {inquirySubmitLoading ? '등록 중...' : '등록'}
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

                                                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                                    <button
                                                        key={page}
                                                        style={page === currentPage ? activePageButtonStyle : pageButtonStyle}
                                                        onClick={() => setCurrentPage(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}

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

                <div style={bottomButtonWrapStyle}>
                    <Link to="/" style={backButtonStyle}>
                        목록으로
                    </Link>
                </div>
            </div>
        </div>
    )
}

function PageState({ text }: { text: string }) {
    return <div style={stateBoxStyle}>{text}</div>
}

const pageStyle = {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    padding: '40px 24px 96px',
    color: '#111827',
} as const

const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
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
    gap: '18px',
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
    fontSize: '38px',
    fontWeight: 900,
    lineHeight: 1.32,
    letterSpacing: '-0.04em',
    wordBreak: 'keep-all',
} as const

const shortDescriptionStyle = {
    margin: 0,
    color: '#6b7280',
    fontSize: '17px',
    lineHeight: 1.7,
} as const

const priceBoxStyle = {
    border: '1px solid #ececec',
    borderRadius: '22px',
    padding: '24px',
    backgroundColor: '#ffffff',
} as const

const saleOnlyLabelStyle = {
    color: '#6b7280',
    fontSize: '15px',
    fontWeight: 700,
} as const

const salePriceStyle = {
    marginTop: '8px',
    color: '#111827',
    fontSize: '40px',
    fontWeight: 900,
    letterSpacing: '-0.03em',
} as const

const categoryTextStyle = {
    marginTop: '14px',
    color: '#1d4ed8',
    fontSize: '15px',
    fontWeight: 700,
} as const

const optionBoxStyle = {
    border: '1px solid #ececec',
    borderRadius: '20px',
    padding: '22px 24px',
    backgroundColor: '#ffffff',
} as const

const optionTitleStyle = {
    fontSize: '16px',
    fontWeight: 800,
    marginBottom: '12px',
} as const

const optionPlaceholderStyle = {
    border: '1px dashed #d1d5db',
    borderRadius: '14px',
    padding: '18px 16px',
    color: '#6b7280',
    fontSize: '15px',
} as const

const buttonRowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1.2fr 1.4fr',
    gap: '12px',
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

const bottomButtonWrapStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '36px',
} as const

const backButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '140px',
    height: '50px',
    borderRadius: '14px',
    border: '1px solid #d1d5db',
    textDecoration: 'none',
    color: '#111827',
    fontWeight: 700,
    backgroundColor: '#ffffff',
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