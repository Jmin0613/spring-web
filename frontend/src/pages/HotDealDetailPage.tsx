import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'

type HotDealDetail = {
    description: string
    discountRate: number
    endTime: string
    hotDealId: number
    hotDealPrice: number
    hotDealStock: number
    imageUrl: string | null
    originalPrice: number
    productName: string
    productId: number | null
    startTime: string
    status: string
}

type HotDealDetailTab = 'detail' | 'review' | 'inquiry'
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
    likedByCurrentUser?: boolean
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

type ProductInquiryListItem = {
    id: number
    title: string
    writerNickName?: string
    writerId?: number
    status: 'WAITING' | 'ANSWERED'
    createdAt: string
    secret?: boolean
}

const API_BASE_URL = 'http://localhost:8080'

function formatPrice(price: number) {
    return `${price.toLocaleString('ko-KR')}원`
}

function formatDateTime(dateString: string) {
    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
        return dateString
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')

    return `${year}.${month}.${day} ${hour}:${minute}`
}

function formatReviewDate(dateTime: string) {
    return dateTime.slice(0, 10).replaceAll('-', '.')
}

function formatInquiryDate(dateTime: string) {
    return dateTime.slice(0, 10).replaceAll('-', '.')
}

function getStatusLabel(status: string) {
    if (status === 'ON_SALE') {
        return '진행중'
    }

    if (status === 'READY') {
        return '오픈예정'
    }

    if (status === 'SOLD_OUT') {
        return '품절'
    }

    return status
}

function getInquiryStatusLabel(status: 'WAITING' | 'ANSWERED') {
    if (status === 'ANSWERED') {
        return '답변완료'
    }

    return '답변대기'
}

function getEmoji(name: string) {
    if (!name) return '🎁'
    return '🎁'
}

function renderStars(rating: number) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

function getRatingPercent(count: number, total: number) {
    if (total === 0) return 0
    return Math.round((count / total) * 100)
}

function getWriterLabel(target: { writerNickName?: string }) {
    return target.writerNickName ?? '알 수 없음'
}

function isSecretInquiry(inquiry: ProductInquiryListItem) {
    return inquiry.secret === true
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

function PageState({ text }: { text: string }) {
    return (
        <div style={pageStyle}>
            <SiteHeader />
            <div style={containerStyle}>
                <div style={stateBoxStyle}>{text}</div>
            </div>
        </div>
    )
}

export default function HotDealDetailPage() {
    const { id } = useParams()
    const [searchParams, setSearchParams] = useSearchParams()

    const [detail, setDetail] = useState<HotDealDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [reviewSort, setReviewSort] = useState<ReviewSortType>('BEST')
    const [reviewPageData, setReviewPageData] = useState<ReviewPageResponse | null>(null)
    const [reviewsLoading, setReviewsLoading] = useState(false)
    const [reviewsError, setReviewsError] = useState('')

    const [inquiries, setInquiries] = useState<ProductInquiryListItem[]>([])
    const [inquiriesLoading, setInquiriesLoading] = useState(false)
    const [inquiriesError, setInquiriesError] = useState('')

    const tabParam = searchParams.get('tab')
    const activeTab: HotDealDetailTab =
        tabParam === 'review' || tabParam === 'inquiry' ? tabParam : 'detail'

    function handleTabChange(tab: HotDealDetailTab) {
        const nextSearchParams = new URLSearchParams(searchParams)

        if (tab === 'detail') {
            nextSearchParams.delete('tab')
        } else {
            nextSearchParams.set('tab', tab)
        }

        setSearchParams(nextSearchParams)
    }

    useEffect(() => {
        async function loadHotDealDetail() {
            if (!id) {
                setError('잘못된 접근입니다.')
                setLoading(false)
                return
            }

            try {
                const response = await axios.get<HotDealDetail>(`${API_BASE_URL}/hotdeals/${id}`)
                setDetail(response.data)
            } catch (e) {
                setError('핫딜 상세를 불러오지 못했습니다.')
            } finally {
                setLoading(false)
            }
        }

        void loadHotDealDetail()
    }, [id])

    useEffect(() => {
        async function loadReviews() {
            if (!detail?.productId) {
                setReviewPageData(null)
                return
            }

            try {
                setReviewsLoading(true)
                setReviewsError('')

                const response = await axios.get<ReviewPageResponse>(
                    `${API_BASE_URL}/products/${detail.productId}/reviews`,
                    {
                        params: {
                            sort: reviewSort,
                            page: 0,
                            size: 3,
                        },
                        withCredentials: true,
                    },
                )

                setReviewPageData(response.data)
            } catch (e) {
                setReviewsError('상품후기를 불러오지 못했습니다.')
            } finally {
                setReviewsLoading(false)
            }
        }

        void loadReviews()
    }, [detail?.productId, reviewSort])

    useEffect(() => {
        async function loadInquiries() {
            if (!detail?.productId) {
                setInquiries([])
                return
            }

            try {
                setInquiriesLoading(true)
                setInquiriesError('')

                const response = await axios.get<ProductInquiryListItem[]>(
                    `${API_BASE_URL}/products/${detail.productId}/inquiries`,
                )
                setInquiries(response.data)
            } catch (e) {
                setInquiriesError('상품문의를 불러오지 못했습니다.')
            } finally {
                setInquiriesLoading(false)
            }
        }

        void loadInquiries()
    }, [detail?.productId])

    const periodText = useMemo(() => {
        if (!detail) {
            return ''
        }

        return `${formatDateTime(detail.startTime)} ~ ${formatDateTime(detail.endTime)}`
    }, [detail])

    const reviewSummary = reviewPageData?.summary ?? null
    const previewReviews = reviewPageData?.reviews ?? []
    const previewInquiries = inquiries.slice(0, 5)

    const totalReviewCount = reviewSummary?.totalCount ?? 0
    const fiveStarPercent = reviewSummary ? getRatingPercent(reviewSummary.fiveStarCount, totalReviewCount) : 0
    const fourStarPercent = reviewSummary ? getRatingPercent(reviewSummary.fourStarCount, totalReviewCount) : 0
    const threeStarPercent = reviewSummary ? getRatingPercent(reviewSummary.threeStarCount, totalReviewCount) : 0
    const twoStarPercent = reviewSummary ? getRatingPercent(reviewSummary.twoStarCount, totalReviewCount) : 0
    const oneStarPercent = reviewSummary ? getRatingPercent(reviewSummary.oneStarCount, totalReviewCount) : 0

    if (loading) {
        return <PageState text="핫딜 상세를 불러오는 중입니다..." />
    }

    if (error) {
        return <PageState text={error} />
    }

    if (!detail) {
        return <PageState text="핫딜 정보를 찾을 수 없습니다." />
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
                    <span>핫딜 상세</span>
                </div>

                <section style={heroSectionStyle}>
                    <div style={heroImageWrapStyle}>
                        <div style={heroImageStyle}>
                            <div style={heroImageBadgeStyle}>대표 이미지</div>
                            <div style={heroEmojiStyle}>{getEmoji(detail.productName)}</div>
                        </div>
                    </div>

                    <div style={heroInfoStyle}>
                        <div style={statusBadgeStyle}>{getStatusLabel(detail.status)}</div>

                        <h1 style={titleStyle}>{detail.productName}</h1>

                        <p style={shortDescriptionStyle}>{detail.description}</p>

                        <div style={priceCardStyle}>
                            <div style={priceCardTitleStyle}>핫딜가</div>

                            <div style={priceCardTopRowStyle}>
                                <div style={priceMainAreaStyle}>
                                    <div style={originalPriceStyle}>{formatPrice(detail.originalPrice)}</div>

                                    <div style={discountPriceRowStyle}>
                                        <span style={discountRateStyle}>{detail.discountRate}%</span>
                                        <span style={salePriceStyle}>{formatPrice(detail.hotDealPrice)}</span>
                                    </div>
                                </div>

                                <div style={stockBoxStyle}>
                                    <div style={stockLabelStyle}>남은 수량</div>
                                    <div style={stockValueStyle}>{detail.hotDealStock}개</div>
                                </div>
                            </div>

                            <div style={periodTextStyle}>핫딜 기간 {periodText}</div>
                        </div>

                        <div style={optionBoxStyle}>
                            <div style={optionTitleStyle}>구매 옵션</div>
                            <div style={optionPlaceholderStyle}>수량 선택 / 옵션 선택 영역 (추후 구현)</div>
                        </div>

                        <div style={buttonRowStyle}>
                            <button type="button" style={ghostButtonStyle}>
                                공유
                            </button>
                            <button type="button" style={ghostButtonStyle}>
                                찜하기
                            </button>
                            <button type="button" style={ghostButtonStyle}>
                                장바구니
                            </button>
                            <button type="button" style={primaryButtonStyle}>
                                구매하기
                            </button>
                        </div>
                    </div>
                </section>

                <div style={tabWrapStyle}>
                    <div style={tabHeaderStyle}>
                        <button
                            type="button"
                            style={activeTab === 'detail' ? activeTabStyle : tabStyle}
                            onClick={() => handleTabChange('detail')}
                        >
                            상세정보
                        </button>

                        <button
                            type="button"
                            style={activeTab === 'review' ? activeTabStyle : tabStyle}
                            onClick={() => handleTabChange('review')}
                        >
                            상품후기
                        </button>

                        <button
                            type="button"
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
                                    핫딜은 잠깐 진행되는 판매 이벤트이기 때문에, 리뷰와 문의는 핫딜 자체가 아니라
                                    원본 상품 기준으로 연결해서 보여주도록 구성했습니다.
                                </p>
                                <p style={detailTextStyle}>
                                    아래 탭에서 상품후기와 상품문의를 미리 볼 수 있고, 전체 확인은 원본 상품 상세로
                                    이동해서 이어서 볼 수 있습니다.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'review' && (
                        <div style={detailContentWrapStyle}>
                            <div style={detailTextBoxStyle}>
                                <div style={sectionTopRowStyle}>
                                    <div>
                                        <h2 style={detailSectionTitleStyle}>상품 후기</h2>
                                        <p style={sectionSubTextStyle}>
                                            핫딜이 아닌 원본 상품 기준 리뷰를 보여줍니다.
                                        </p>
                                    </div>

                                    {detail.productId && (
                                        <Link
                                            to={`/products/${detail.productId}?tab=review`}
                                            style={linkButtonStyle}
                                        >
                                            원본 상품 후기 전체 보기
                                        </Link>
                                    )}
                                </div>

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
                                            <div style={reviewSortButtonGroupStyle}>
                                                <button
                                                    type="button"
                                                    style={reviewSort === 'BEST' ? activeSortButtonStyle : sortButtonStyle}
                                                    onClick={() => setReviewSort('BEST')}
                                                >
                                                    베스트순
                                                </button>

                                                <button
                                                    type="button"
                                                    style={reviewSort === 'LATEST' ? activeSortButtonStyle : sortButtonStyle}
                                                    onClick={() => setReviewSort('LATEST')}
                                                >
                                                    최신순
                                                </button>
                                            </div>

                                            {previewReviews.length === 0 ? (
                                                <div style={stateBoxStyle}>등록된 상품후기가 없습니다.</div>
                                            ) : (
                                                <div style={reviewCardListStyle}>
                                                    {previewReviews.map((review) => (
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
                                                                </div>
                                                            </div>

                                                            <div style={reviewTitleStyle}>{review.title}</div>
                                                            <div style={reviewContentStyle}>{review.content}</div>

                                                            <div style={reviewHelpCountStyle}>
                                                                {(review.likeCount ?? 0) > 0
                                                                    ? `${review.likeCount ?? 0}명이 도움이 됐어요`
                                                                    : '아직 추천이 없습니다.'}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
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
                                <div style={sectionTopRowStyle}>
                                    <div>
                                        <h2 style={detailSectionTitleStyle}>상품 문의</h2>
                                        <p style={sectionSubTextStyle}>
                                            핫딜이 아닌 원본 상품 기준 문의를 보여줍니다.
                                        </p>
                                    </div>

                                    {detail.productId && (
                                        <Link
                                            to={`/products/${detail.productId}?tab=inquiry`}
                                            style={linkButtonStyle}
                                        >
                                            원본 상품 문의 전체 보기
                                        </Link>
                                    )}
                                </div>

                                {inquiriesLoading ? (
                                    <div style={stateBoxStyle}>상품문의를 불러오는 중입니다...</div>
                                ) : inquiriesError ? (
                                    <div style={stateBoxStyle}>{inquiriesError}</div>
                                ) : previewInquiries.length === 0 ? (
                                    <div style={stateBoxStyle}>등록된 상품문의가 없습니다.</div>
                                ) : (
                                    <div style={inquiryPreviewListStyle}>
                                        {previewInquiries.map((inquiry) => (
                                            <div key={inquiry.id} style={inquiryPreviewCardStyle}>
                                                <div style={inquiryPreviewTopRowStyle}>
                                                    <span
                                                        style={{
                                                            ...inquiryStatusBadgeStyle,
                                                            backgroundColor:
                                                                inquiry.status === 'ANSWERED'
                                                                    ? '#dbeafe'
                                                                    : '#f3f4f6',
                                                            color:
                                                                inquiry.status === 'ANSWERED'
                                                                    ? '#1d4ed8'
                                                                    : '#374151',
                                                        }}
                                                    >
                                                        {getInquiryStatusLabel(inquiry.status)}
                                                    </span>

                                                    <span style={inquiryPreviewMetaStyle}>
                                                        {getWriterLabel(inquiry)} · {formatInquiryDate(inquiry.createdAt)}
                                                    </span>
                                                </div>

                                                <div style={inquiryPreviewTitleStyle}>
                                                    {isSecretInquiry(inquiry)
                                                        ? '🔒 비밀문의입니다.'
                                                        : inquiry.title}
                                                </div>

                                                <div style={inquiryPreviewSubTextStyle}>
                                                    {isSecretInquiry(inquiry)
                                                        ? '비밀글 상세 내용은 원본 상품 상세에서 작성자만 확인할 수 있습니다.'
                                                        : '문의 상세 확인과 작성은 원본 상품 상세 페이지에서 이어집니다.'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

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
    gap: '12px',
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

const priceCardStyle = {
    width: '100%',
    borderRadius: '20px',
    padding: '16px 18px 14px',
    backgroundColor: '#f9fafb',
    boxSizing: 'border-box',
} as const

const priceCardTitleStyle = {
    color: '#6b7280',
    fontSize: '13px',
    fontWeight: 700,
    marginBottom: '10px',
    textAlign: 'left',
} as const

const priceCardTopRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '12px',
} as const

const priceMainAreaStyle = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
} as const

const originalPriceStyle = {
    color: '#9ca3af',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'line-through',
    marginBottom: '6px',
    textAlign: 'left',
} as const

const discountPriceRowStyle = {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    flexWrap: 'wrap',
} as const

const discountRateStyle = {
    color: '#dc2626',
    fontSize: '18px',
    fontWeight: 900,
    lineHeight: 1.1,
} as const

const salePriceStyle = {
    color: '#111827',
    fontSize: '34px',
    fontWeight: 900,
    letterSpacing: '-0.03em',
    lineHeight: 1,
    textAlign: 'left',
} as const

const stockBoxStyle = {
    width: '132px',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
} as const

const stockLabelStyle = {
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: 700,
    textAlign: 'center',
} as const

const stockValueStyle = {
    color: '#111827',
    fontSize: '24px',
    fontWeight: 900,
    lineHeight: 1.1,
    textAlign: 'center',
} as const

const periodTextStyle = {
    marginTop: '10px',
    color: '#111827',
    fontSize: '14px',
    fontWeight: 700,
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
    margin: '0 0 10px',
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

const sectionTopRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '18px',
} as const

const sectionSubTextStyle = {
    margin: 0,
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: 1.6,
} as const

const linkButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '180px',
    height: '42px',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#111827',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 700,
    padding: '0 16px',
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

const reviewTopMetaBlockStyle = {
    display: 'grid',
    gap: '6px',
    width: '100%',
    textAlign: 'left',
    justifyItems: 'start',
} as const

const reviewWriterStyle = {
    color: '#111827',
    fontSize: '16px',
    fontWeight: 800,
    textAlign: 'left',
} as const

const reviewMetaInlineRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    width: '100%',
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

const reviewHelpCountStyle = {
    color: '#6b7280',
    fontSize: '13px',
    fontWeight: 700,
    marginTop: '2px',
} as const

const inquiryPreviewListStyle = {
    display: 'grid',
    gap: '16px',
} as const

const inquiryPreviewCardStyle = {
    border: '1px solid #ececec',
    borderRadius: '16px',
    padding: '18px 20px',
    backgroundColor: '#ffffff',
    display: 'grid',
    gap: '10px',
} as const

const inquiryPreviewTopRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
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

const inquiryPreviewMetaStyle = {
    color: '#6b7280',
    fontSize: '13px',
} as const

const inquiryPreviewTitleStyle = {
    color: '#111827',
    fontSize: '16px',
    fontWeight: 800,
    textAlign: 'left',
} as const

const inquiryPreviewSubTextStyle = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: 1.7,
    textAlign: 'left',
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