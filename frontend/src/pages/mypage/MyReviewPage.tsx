import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import SiteHeader from '../../components/SiteHeader.tsx'
import './MyReviewPage.css'

const API_BASE_URL = 'http://localhost:8080'
const PAGE_SIZE = 10

type MyReviewItem = {
    reviewId: number
    productId: number
    productNameSnapshot: string
    rating: number
    title: string
    content: string
    createdAt: string
    likeCount?: number | null
    quantity: number
}

function formatDate(dateTime: string) {
    return dateTime.slice(0, 10).replaceAll('-', '.')
}

function renderStars(rating: number) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

function getSafeLikeCount(likeCount?: number | null) {
    if (typeof likeCount !== 'number' || Number.isNaN(likeCount) || likeCount < 0) {
        return 0
    }

    return likeCount
}

function getReviewLikeSummary(likeCount?: number | null) {
    const safeLikeCount = getSafeLikeCount(likeCount)
    return `도움 ${safeLikeCount}명`
}

function getErrorMessage(error: unknown, fallback: string) {
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

    return fallback
}

export default function MyReviewPage() {
    const [reviews, setReviews] = useState<MyReviewItem[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    const [currentPage, setCurrentPage] = useState(1)
    const [openReviewId, setOpenReviewId] = useState<number | null>(null)

    async function loadMyReviews() {
        try {
            setLoading(true)
            setErrorMessage('')

            const response = await axios.get<MyReviewItem[]>(`${API_BASE_URL}/mypage/reviews`, {
                withCredentials: true,
            })

            setReviews(response.data)
        } catch (error) {
            setErrorMessage(getErrorMessage(error, '내 리뷰 목록을 불러오지 못했습니다.'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadMyReviews()
    }, [])

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(reviews.length / PAGE_SIZE))
    }, [reviews.length])

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

    const pagedReviews = useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE
        return reviews.slice(startIndex, startIndex + PAGE_SIZE)
    }, [reviews, currentPage])

    useEffect(() => {
        if (openReviewId == null) return

        const existsInCurrentPage = pagedReviews.some((item) => item.reviewId === openReviewId)
        if (!existsInCurrentPage) {
            setOpenReviewId(null)
        }
    }, [pagedReviews, openReviewId])

    function handleToggleReview(reviewId: number) {
        setOpenReviewId((prev) => (prev === reviewId ? null : reviewId))
    }

    return (
        <div className="my-review-page">
            <SiteHeader />

            <main className="my-review-page__content">
                <section className="my-review-page__header">
                    <h1 className="my-review-page__title">
                        내 리뷰관리
                        <span className="my-review-page__title-count">총 {reviews.length}개</span>
                    </h1>
                </section>

                {loading ? (
                    <div className="my-review-page__state-box">내 리뷰 목록을 불러오는 중입니다...</div>
                ) : errorMessage ? (
                    <div className="my-review-page__state-box">{errorMessage}</div>
                ) : reviews.length === 0 ? (
                    <div className="my-review-page__empty-box">
                        <div className="my-review-page__empty-emoji">⭐</div>
                        <p className="my-review-page__empty-title">작성한 리뷰가 없습니다.</p>
                        <p className="my-review-page__empty-description">
                            구매한 상품 상세의 리뷰 탭에서 리뷰를 작성해보세요.
                        </p>
                    </div>
                ) : (
                    <>
                        <section className="my-review-page__list">
                            {pagedReviews.map((item) => {
                                const isOpen = openReviewId === item.reviewId

                                return (
                                    <article key={item.reviewId} className="my-review-card">
                                        <div className="my-review-card__top">
                                            <div className="my-review-card__top-left">
                                                <div className="my-review-card__badge-row">
                                                    <span className="my-review-card__rating-badge">
                                                        {renderStars(item.rating)}
                                                    </span>
                                                </div>

                                                <div className="my-review-card__product-name">
                                                    {item.productNameSnapshot}
                                                </div>

                                                <h2 className="my-review-card__title">{item.title}</h2>

                                                <div className="my-review-card__meta">
                                                    <div className="my-review-card__meta-left">
                                                        <span>작성일 {formatDate(item.createdAt)}</span>
                                                        <span>구매수량 {item.quantity}개</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="my-review-card__actions">
                                                <div className="my-review-card__action-buttons">
                                                    <Link
                                                        to={`/products/${item.productId}?tab=review`}
                                                        className="my-review-card__link-button"
                                                    >
                                                        상품 보기
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        className="my-review-card__detail-button"
                                                        onClick={() => handleToggleReview(item.reviewId)}
                                                    >
                                                        {isOpen ? '접기' : '상세 보기'}
                                                    </button>
                                                </div>

                                                <span className="my-review-card__help-count">
                                                    {getReviewLikeSummary(item.likeCount)}
                                                </span>
                                            </div>
                                        </div>

                                        {isOpen && (
                                            <div className="my-review-card__detail-box">
                                                <section className="my-review-card__detail-section">
                                                    <h3 className="my-review-card__detail-label">
                                                        리뷰 내용
                                                    </h3>

                                                    <p className="my-review-card__detail-text">
                                                        {item.content}
                                                    </p>
                                                </section>
                                            </div>
                                        )}
                                    </article>
                                )
                            })}
                        </section>

                        {totalPages > 1 && (
                            <div className="my-review-page__pagination">
                                <button
                                    type="button"
                                    className="my-review-page__page-button"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    ‹
                                </button>

                                <span className="my-review-page__page-indicator">
                                    {currentPage} / {totalPages}
                                </span>

                                <button
                                    type="button"
                                    className="my-review-page__page-button"
                                    onClick={() =>
                                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                                    }
                                    disabled={currentPage === totalPages}
                                >
                                    ›
                                </button>
                            </div>
                        )}

                    </>
                )}
            </main>
        </div>
    )
}