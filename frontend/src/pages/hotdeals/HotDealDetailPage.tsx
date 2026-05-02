import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import SiteHeader from '../../components/SiteHeader.tsx'
import './HotDealDetailPage.css'

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
    if (status === 'ON_SALE') return '진행중'
    if (status === 'READY') return '오픈예정'
    if (status === 'SOLD_OUT') return '품절'
    if (status === 'ENDED') return '종료'
    if (status === 'STOPPED') return '중단'

    return status
}

function getInquiryStatusLabel(status: 'WAITING' | 'ANSWERED') {
    if (status === 'ANSWERED') {
        return '답변완료'
    }

    return '답변대기'
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

function HotDealImage({
                          imageUrl,
                          alt,
                      }: {
    imageUrl: string | null
    alt: string
}) {
    const [imageError, setImageError] = useState(false)

    useEffect(() => {
        setImageError(false)
    }, [imageUrl])

    if (!imageUrl || imageError) {
        return <span className="hotdeal-detail-image-placeholder">이미지 없음</span>
    }

    return (
        <img
            className="hotdeal-detail-image-img"
            src={imageUrl}
            alt={alt}
            onError={() => setImageError(true)}
        />
    )
}

function ReviewRatingRow({
                             label,
                             percent,
                         }: {
    label: string
    percent: number
}) {
    return (
        <div className="hotdeal-review-rating-row">
            <span className="hotdeal-review-rating-label">{label}</span>

            <div className="hotdeal-review-bar-track">
                <div
                    className="hotdeal-review-bar-fill"
                    style={{
                        width: `${percent}%`,
                    }}
                />
            </div>

            <span className="hotdeal-review-rating-percent">{percent}%</span>
        </div>
    )
}

function PageState({ text }: { text: string }) {
    return (
        <div className="hotdeal-detail-page">
            <SiteHeader />
            <div className="hotdeal-detail-container">
                <div className="hotdeal-detail-state-box">{text}</div>
            </div>
        </div>
    )
}

export default function HotDealDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
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

    const [quantity, setQuantity] = useState(1)
    // 핫딜 구매 수량

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

    async function handleShareHotDeal() {
        const shareUrl = window.location.href

        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareUrl)
            } else {
                const textarea = document.createElement('textarea')
                textarea.value = shareUrl
                textarea.style.position = 'fixed'
                textarea.style.left = '-9999px'
                document.body.appendChild(textarea)
                textarea.focus()
                textarea.select()
                document.execCommand('copy')
                document.body.removeChild(textarea)
            }

            alert('핫딜 링크가 복사되었습니다.')
        } catch (error) {
            alert('링크 복사에 실패했습니다.')
        }
    }

    async function handleBuyHotDeal() {
        if (!detail) return

        if (detail.status !== 'ON_SALE') {
            alert('현재 구매할 수 없는 핫딜입니다.')
            return
        }

        if (detail.hotDealStock <= 0) {
            alert('핫딜 재고가 없습니다.')
            return
        }

        if (quantity <= 0) {
            alert('구매 수량은 1개 이상이어야 합니다.')
            return
        }

        if (quantity > detail.hotDealStock) {
            alert('구매 수량이 남은 재고보다 많습니다.')
            return
        }

        navigate('/order-sheet', {
            state: {
                mode: 'HOTDEAL_DIRECT',
                hotDealId: detail.hotDealId,
                productId: detail.productId,
                productName: detail.productName,
                imageUrl: detail.imageUrl,
                quantity,
                price: detail.hotDealPrice,
                originalPrice: detail.originalPrice,
                discountRate: detail.discountRate,
            },
        })
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
    const fiveStarPercent = reviewSummary
        ? getRatingPercent(reviewSummary.fiveStarCount, totalReviewCount)
        : 0
    const fourStarPercent = reviewSummary
        ? getRatingPercent(reviewSummary.fourStarCount, totalReviewCount)
        : 0
    const threeStarPercent = reviewSummary
        ? getRatingPercent(reviewSummary.threeStarCount, totalReviewCount)
        : 0
    const twoStarPercent = reviewSummary
        ? getRatingPercent(reviewSummary.twoStarCount, totalReviewCount)
        : 0
    const oneStarPercent = reviewSummary
        ? getRatingPercent(reviewSummary.oneStarCount, totalReviewCount)
        : 0

    if (loading) {
        return <PageState text="핫딜 상세를 불러오는 중입니다..." />
    }

    if (error) {
        return <PageState text={error} />
    }

    if (!detail) {
        return <PageState text="핫딜 정보를 찾을 수 없습니다." />
    }

    const canBuyHotDeal = detail.status === 'ON_SALE' && detail.hotDealStock > 0

    return (
        <div className="hotdeal-detail-page">
            <SiteHeader />

            <div className="hotdeal-detail-container">
                <div className="hotdeal-detail-breadcrumb">
                    <Link to="/" className="hotdeal-detail-breadcrumb-link">
                        홈
                    </Link>
                    <span className="hotdeal-detail-breadcrumb-divider">/</span>
                    <span>핫딜 상세</span>
                </div>

                <section className="hotdeal-detail-hero">
                    <div className="hotdeal-detail-image-wrap">
                        <div className="hotdeal-detail-image-box">
                            <div className="hotdeal-detail-image-badge">대표 이미지</div>
                            <HotDealImage imageUrl={detail.imageUrl} alt={detail.productName} />
                        </div>
                    </div>

                    <div className="hotdeal-detail-info">
                        <div className="hotdeal-detail-status-badge">
                            {getStatusLabel(detail.status)}
                        </div>

                        <h1 className="hotdeal-detail-title">{detail.productName}</h1>

                        <p className="hotdeal-detail-description">{detail.description}</p>

                        <div className="hotdeal-detail-price-card">
                            <div className="hotdeal-detail-price-card-title">핫딜가</div>

                            <div className="hotdeal-detail-price-card-top-row">
                                <div className="hotdeal-detail-price-main-area">
                                    <div className="hotdeal-detail-original-price">
                                        {formatPrice(detail.originalPrice)}
                                    </div>

                                    <div className="hotdeal-detail-discount-price-row">
                                        <span className="hotdeal-detail-discount-rate">
                                            {detail.discountRate}%
                                        </span>
                                        <span className="hotdeal-detail-sale-price">
                                            {formatPrice(detail.hotDealPrice)}
                                        </span>
                                    </div>
                                </div>

                                <div className="hotdeal-detail-stock-box">
                                    <div className="hotdeal-detail-stock-label">남은 수량</div>
                                    <div className="hotdeal-detail-stock-value">
                                        {detail.hotDealStock}개
                                    </div>
                                </div>
                            </div>

                            <div className="hotdeal-detail-period-text">
                                핫딜 기간 {periodText}
                            </div>
                        </div>

                        <div className="hotdeal-detail-option-box">
                            <div className="hotdeal-detail-option-title">구매 수량</div>

                            <div className="hotdeal-detail-quantity-row">
                                <button
                                    type="button"
                                    className="hotdeal-detail-quantity-button"
                                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                    disabled={!canBuyHotDeal || quantity <= 1}
                                >
                                    -
                                </button>

                                <input
                                    className="hotdeal-detail-quantity-input"
                                    type="number"
                                    min={1}
                                    max={detail.hotDealStock}
                                    value={quantity}
                                    onChange={(e) => {
                                        const nextQuantity = Number(e.target.value)

                                        if (Number.isNaN(nextQuantity)) {
                                            setQuantity(1)
                                            return
                                        }

                                        setQuantity(
                                            Math.min(
                                                detail.hotDealStock,
                                                Math.max(1, nextQuantity),
                                            ),
                                        )
                                    }}
                                    disabled={!canBuyHotDeal}
                                />

                                <button
                                    type="button"
                                    className="hotdeal-detail-quantity-button"
                                    onClick={() =>
                                        setQuantity((prev) =>
                                            Math.min(detail.hotDealStock, prev + 1),
                                        )
                                    }
                                    disabled={!canBuyHotDeal || quantity >= detail.hotDealStock}
                                >
                                    +
                                </button>

                                <span className="hotdeal-detail-quantity-help">
                                    최대 {detail.hotDealStock.toLocaleString('ko-KR')}개 구매 가능
                                </span>
                            </div>
                        </div>

                        <div className="hotdeal-detail-button-row hotdeal-detail-button-row--simple">
                            <button
                                type="button"
                                className="hotdeal-detail-ghost-button"
                                onClick={handleShareHotDeal}
                            >
                                공유
                            </button>

                            <button
                                type="button"
                                className="hotdeal-detail-primary-button"
                                onClick={handleBuyHotDeal}
                                disabled={!canBuyHotDeal}
                            >
                                {canBuyHotDeal ? '구매하기' : '구매불가'}
                            </button>
                        </div>
                    </div>
                </section>

                <div className="hotdeal-detail-tab-wrap">
                    <div className="hotdeal-detail-tab-header">
                        <button
                            type="button"
                            className={
                                activeTab === 'detail'
                                    ? 'hotdeal-detail-tab-button hotdeal-detail-tab-button--active'
                                    : 'hotdeal-detail-tab-button'
                            }
                            onClick={() => handleTabChange('detail')}
                        >
                            상세정보
                        </button>

                        <button
                            type="button"
                            className={
                                activeTab === 'review'
                                    ? 'hotdeal-detail-tab-button hotdeal-detail-tab-button--active'
                                    : 'hotdeal-detail-tab-button'
                            }
                            onClick={() => handleTabChange('review')}
                        >
                            상품후기
                        </button>

                        <button
                            type="button"
                            className={
                                activeTab === 'inquiry'
                                    ? 'hotdeal-detail-tab-button hotdeal-detail-tab-button--active'
                                    : 'hotdeal-detail-tab-button'
                            }
                            onClick={() => handleTabChange('inquiry')}
                        >
                            상품문의
                        </button>
                    </div>

                    {activeTab === 'detail' && (
                        <div className="hotdeal-detail-content-wrap">
                            <div className="hotdeal-detail-placeholder-image-box">
                                <div className="hotdeal-detail-placeholder-title">
                                    상세 설명 이미지
                                </div>
                                <div className="hotdeal-detail-placeholder-subtitle">
                                    리팩토링 전까지 임시 플레이스홀더
                                </div>
                            </div>

                            <div className="hotdeal-detail-text-box">
                                <h2 className="hotdeal-detail-section-title">상품 설명</h2>
                                <p className="hotdeal-detail-text">{detail.description}</p>
                                <p className="hotdeal-detail-text">
                                    핫딜은 잠깐 진행되는 판매 이벤트이기 때문에, 리뷰와 문의는
                                    핫딜 자체가 아니라 원본 상품 기준으로 연결해서 보여주도록
                                    구성했습니다.
                                </p>
                                <p className="hotdeal-detail-text">
                                    아래 탭에서 상품후기와 상품문의를 미리 볼 수 있고, 전체 확인은
                                    원본 상품 상세로 이동해서 이어서 볼 수 있습니다.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'review' && (
                        <div className="hotdeal-detail-content-wrap">
                            <div className="hotdeal-detail-text-box">
                                <div className="hotdeal-section-top-row">
                                    <div>
                                        <h2 className="hotdeal-detail-section-title">상품 후기</h2>
                                        <p className="hotdeal-section-sub-text">
                                            핫딜이 아닌 원본 상품 기준 리뷰를 보여줍니다.
                                        </p>
                                    </div>

                                    {detail.productId && (
                                        <Link
                                            to={`/products/${detail.productId}?tab=review`}
                                            className="hotdeal-detail-link-button"
                                        >
                                            원본 상품 후기 전체 보기
                                        </Link>
                                    )}
                                </div>

                                {reviewsLoading ? (
                                    <div className="hotdeal-detail-state-box">
                                        상품후기를 불러오는 중입니다...
                                    </div>
                                ) : reviewsError ? (
                                    <div className="hotdeal-detail-state-box">
                                        {reviewsError}
                                    </div>
                                ) : !reviewSummary ? (
                                    <div className="hotdeal-detail-state-box">
                                        리뷰 정보를 불러오지 못했습니다.
                                    </div>
                                ) : (
                                    <div className="hotdeal-review-section-wrap">
                                        <div className="hotdeal-review-summary-box">
                                            <div className="hotdeal-review-average-row">
                                                <div className="hotdeal-review-average-stars">
                                                    {renderStars(
                                                        Math.round(reviewSummary.averageRating),
                                                    )}
                                                </div>
                                                <div className="hotdeal-review-average-score">
                                                    {reviewSummary.averageRating.toFixed(1)}
                                                </div>
                                            </div>

                                            <div className="hotdeal-review-total-count">
                                                총{' '}
                                                {reviewSummary.totalCount.toLocaleString('ko-KR')}개
                                            </div>

                                            <div className="hotdeal-review-rating-rows">
                                                <ReviewRatingRow
                                                    label="최고"
                                                    percent={fiveStarPercent}
                                                />
                                                <ReviewRatingRow
                                                    label="좋음"
                                                    percent={fourStarPercent}
                                                />
                                                <ReviewRatingRow
                                                    label="보통"
                                                    percent={threeStarPercent}
                                                />
                                                <ReviewRatingRow
                                                    label="별로"
                                                    percent={twoStarPercent}
                                                />
                                                <ReviewRatingRow
                                                    label="나쁨"
                                                    percent={oneStarPercent}
                                                />
                                            </div>
                                        </div>

                                        <div className="hotdeal-review-list-area">
                                            <div className="hotdeal-review-sort-button-group">
                                                <button
                                                    type="button"
                                                    className={
                                                        reviewSort === 'BEST'
                                                            ? 'hotdeal-review-sort-button hotdeal-review-sort-button--active'
                                                            : 'hotdeal-review-sort-button'
                                                    }
                                                    onClick={() => setReviewSort('BEST')}
                                                >
                                                    베스트순
                                                </button>

                                                <button
                                                    type="button"
                                                    className={
                                                        reviewSort === 'LATEST'
                                                            ? 'hotdeal-review-sort-button hotdeal-review-sort-button--active'
                                                            : 'hotdeal-review-sort-button'
                                                    }
                                                    onClick={() => setReviewSort('LATEST')}
                                                >
                                                    최신순
                                                </button>
                                            </div>

                                            {previewReviews.length === 0 ? (
                                                <div className="hotdeal-detail-state-box">
                                                    등록된 상품후기가 없습니다.
                                                </div>
                                            ) : (
                                                <div className="hotdeal-review-card-list">
                                                    {previewReviews.map((review) => (
                                                        <div
                                                            key={review.reviewId}
                                                            className="hotdeal-review-card"
                                                        >
                                                            <div className="hotdeal-review-top-meta-block">
                                                                <div className="hotdeal-review-writer">
                                                                    {getWriterLabel(review)}
                                                                </div>

                                                                <div className="hotdeal-review-meta-inline-row">
                                                                    <span className="hotdeal-review-stars">
                                                                        {renderStars(review.rating)}
                                                                    </span>

                                                                    <span className="hotdeal-review-date">
                                                                        {formatReviewDate(
                                                                            review.createdAt,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="hotdeal-review-title">
                                                                {review.title}
                                                            </div>
                                                            <div className="hotdeal-review-content">
                                                                {review.content}
                                                            </div>

                                                            <div className="hotdeal-review-help-count">
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
                        <div className="hotdeal-detail-content-wrap">
                            <div className="hotdeal-detail-text-box">
                                <div className="hotdeal-section-top-row">
                                    <div>
                                        <h2 className="hotdeal-detail-section-title">상품 문의</h2>
                                        <p className="hotdeal-section-sub-text">
                                            핫딜이 아닌 원본 상품 기준 문의를 보여줍니다.
                                        </p>
                                    </div>

                                    {detail.productId && (
                                        <Link
                                            to={`/products/${detail.productId}?tab=inquiry`}
                                            className="hotdeal-detail-link-button"
                                        >
                                            원본 상품 문의 전체 보기
                                        </Link>
                                    )}
                                </div>

                                {inquiriesLoading ? (
                                    <div className="hotdeal-detail-state-box">
                                        상품문의를 불러오는 중입니다...
                                    </div>
                                ) : inquiriesError ? (
                                    <div className="hotdeal-detail-state-box">
                                        {inquiriesError}
                                    </div>
                                ) : previewInquiries.length === 0 ? (
                                    <div className="hotdeal-detail-state-box">
                                        등록된 상품문의가 없습니다.
                                    </div>
                                ) : (
                                    <div className="hotdeal-inquiry-preview-list">
                                        {previewInquiries.map((inquiry) => (
                                            <div
                                                key={inquiry.id}
                                                className="hotdeal-inquiry-preview-card"
                                            >
                                                <div className="hotdeal-inquiry-preview-top-row">
                                                    <span
                                                        className={
                                                            inquiry.status === 'ANSWERED'
                                                                ? 'hotdeal-inquiry-status-badge hotdeal-inquiry-status-badge--answered'
                                                                : 'hotdeal-inquiry-status-badge hotdeal-inquiry-status-badge--waiting'
                                                        }
                                                    >
                                                        {getInquiryStatusLabel(inquiry.status)}
                                                    </span>

                                                    <span className="hotdeal-inquiry-preview-meta">
                                                        {getWriterLabel(inquiry)} ·{' '}
                                                        {formatInquiryDate(inquiry.createdAt)}
                                                    </span>
                                                </div>

                                                <div className="hotdeal-inquiry-preview-title">
                                                    {isSecretInquiry(inquiry)
                                                        ? '🔒 비밀문의입니다.'
                                                        : inquiry.title}
                                                </div>

                                                <div className="hotdeal-inquiry-preview-sub-text">
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