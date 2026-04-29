import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import SiteHeader from '../../components/SiteHeader.tsx'
import './MyInquiryPage.css'

const API_BASE_URL = 'http://localhost:8080'
const PAGE_SIZE = 10

type MyInquiryItem = {
    inquiryId: number
    productId: number
    productNameSnapshot: string
    title: string
    status: 'WAITING' | 'ANSWERED'
    secret: boolean
    createdAt: string
    updatedAt?: string | null
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
    updatedAt?: string | null
    answeredAt?: string | null
    writerNickName?: string
}

function formatDate(dateTime: string) {
    return dateTime.slice(0, 10).replaceAll('-', '.')
}

function formatDateTime(dateTime?: string | null) {
    if (!dateTime) return '-'

    const date = new Date(dateTime)

    if (Number.isNaN(date.getTime())) {
        return dateTime
    }

    return date.toLocaleString('ko-KR', {
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
}

function shouldShowUpdatedAt(createdAt: string, updatedAt?: string | null) {
    if (!updatedAt) return false
    return createdAt !== updatedAt
}

function getInquiryStatusLabel(status: 'WAITING' | 'ANSWERED') {
    return status === 'ANSWERED' ? '답변완료' : '답변대기'
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

export default function MyInquiryPage() {
    const [inquiries, setInquiries] = useState<MyInquiryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    const [currentPage, setCurrentPage] = useState(1)

    const [openInquiryId, setOpenInquiryId] = useState<number | null>(null)
    const [detailMap, setDetailMap] = useState<Record<number, ProductInquiryDetailItem>>({})
    const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null)
    const [detailErrorMap, setDetailErrorMap] = useState<Record<number, string>>({})

    async function loadMyInquiries() {
        try {
            setLoading(true)
            setErrorMessage('')

            const response = await axios.get<MyInquiryItem[]>(`${API_BASE_URL}/mypage/inquiries`, {
                withCredentials: true,
            })

            setInquiries(response.data)
        } catch (error) {
            setErrorMessage(getErrorMessage(error, '내 문의 목록을 불러오지 못했습니다.'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadMyInquiries()
    }, [])

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(inquiries.length / PAGE_SIZE))
    }, [inquiries.length])

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

    const pagedInquiries = useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE
        return inquiries.slice(startIndex, startIndex + PAGE_SIZE)
    }, [inquiries, currentPage])

    useEffect(() => {
        if (openInquiryId == null) return

        const existsInCurrentPage = pagedInquiries.some((item) => item.inquiryId === openInquiryId)
        if (!existsInCurrentPage) {
            setOpenInquiryId(null)
        }
    }, [pagedInquiries, openInquiryId])

    async function handleToggleInquiry(item: MyInquiryItem) {
        if (openInquiryId === item.inquiryId) {
            setOpenInquiryId(null)
            return
        }

        if (detailMap[item.inquiryId]) {
            setOpenInquiryId(item.inquiryId)
            return
        }

        try {
            setDetailLoadingId(item.inquiryId)
            setDetailErrorMap((prev) => {
                const next = { ...prev }
                delete next[item.inquiryId]
                return next
            })

            const response = await axios.get<ProductInquiryDetailItem>(
                `${API_BASE_URL}/products/${item.productId}/inquiries/${item.inquiryId}`,
                {
                    withCredentials: true,
                },
            )

            setDetailMap((prev) => ({
                ...prev,
                [item.inquiryId]: response.data,
            }))
            setOpenInquiryId(item.inquiryId)
        } catch (error) {
            setDetailErrorMap((prev) => ({
                ...prev,
                [item.inquiryId]: getErrorMessage(error, '문의 상세를 불러오지 못했습니다.'),
            }))
            setOpenInquiryId(item.inquiryId)
        } finally {
            setDetailLoadingId(null)
        }
    }

    return (
        <div className="my-inquiry-page">
            <SiteHeader />

            <main className="my-inquiry-page__content">
                <section className="my-inquiry-page__header">
                    <h1 className="my-inquiry-page__title">
                        내 문의관리
                        <span className="my-inquiry-page__title-count">총 {inquiries.length}개</span>
                    </h1>
                </section>

                {loading ? (
                    <div className="my-inquiry-page__state-box">내 문의 목록을 불러오는 중입니다...</div>
                ) : errorMessage ? (
                    <div className="my-inquiry-page__state-box">{errorMessage}</div>
                ) : inquiries.length === 0 ? (
                    <div className="my-inquiry-page__empty-box">
                        <div className="my-inquiry-page__empty-emoji">💬</div>
                        <p className="my-inquiry-page__empty-title">작성한 문의가 없습니다.</p>
                        <p className="my-inquiry-page__empty-description">
                            상품 상세의 문의 탭에서 문의를 작성해보세요.
                        </p>
                    </div>
                ) : (
                    <>
                        <section className="my-inquiry-page__list">
                            {pagedInquiries.map((item) => {
                                const isOpen = openInquiryId === item.inquiryId
                                const detailItem = detailMap[item.inquiryId]
                                const detailError = detailErrorMap[item.inquiryId]
                                const isDetailLoading = detailLoadingId === item.inquiryId

                                return (
                                    <article key={item.inquiryId} className="my-inquiry-card">
                                        <div className="my-inquiry-card__top">
                                            <div className="my-inquiry-card__top-left">
                                                <div className="my-inquiry-card__badge-row">
                                                    <span
                                                        className={`my-inquiry-card__status ${
                                                            item.status === 'ANSWERED'
                                                                ? 'my-inquiry-card__status--answered'
                                                                : 'my-inquiry-card__status--waiting'
                                                        }`}
                                                    >
                                                        {getInquiryStatusLabel(item.status)}
                                                    </span>

                                                    {item.secret && (
                                                        <span className="my-inquiry-card__secret-badge">
                                                            비밀글
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="my-inquiry-card__product-name">
                                                    {item.productNameSnapshot}
                                                </div>

                                                <h2 className="my-inquiry-card__title">{item.title}</h2>

                                                <div className="my-inquiry-card__meta">
                                                    <span>작성일 {formatDate(item.createdAt)}</span>

                                                    {shouldShowUpdatedAt(item.createdAt, item.updatedAt) && (
                                                        <span>수정일 {formatDate(item.updatedAt!)}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="my-inquiry-card__actions">
                                                <Link
                                                    to={`/products/${item.productId}?tab=inquiry`}
                                                    className="my-inquiry-card__link-button"
                                                >
                                                    문의 보기
                                                </Link>

                                                <button
                                                    type="button"
                                                    className="my-inquiry-card__detail-button"
                                                    onClick={() => handleToggleInquiry(item)}
                                                >
                                                    {isOpen ? '접기' : '상세 보기'}
                                                </button>
                                            </div>
                                        </div>

                                        {isOpen && (
                                            <div className="my-inquiry-card__detail-box">
                                                {isDetailLoading ? (
                                                    <div className="my-inquiry-card__detail-state">
                                                        문의 상세를 불러오는 중입니다...
                                                    </div>
                                                ) : detailError ? (
                                                    <div className="my-inquiry-card__detail-state">
                                                        {detailError}
                                                    </div>
                                                ) : detailItem ? (
                                                    <>
                                                        <section className="my-inquiry-card__detail-section">
                                                            <h3 className="my-inquiry-card__detail-label">
                                                                문의 내용
                                                            </h3>
                                                            <p className="my-inquiry-card__detail-text">
                                                                {detailItem.content}
                                                            </p>
                                                        </section>

                                                        <section className="my-inquiry-card__detail-section">
                                                            <h3 className="my-inquiry-card__detail-label">
                                                                답변 내용
                                                            </h3>

                                                            {detailItem.status === 'ANSWERED' ? (
                                                                <>
                                                                    <p className="my-inquiry-card__detail-text">
                                                                        {detailItem.answerContent ??
                                                                            '답변 내용이 없습니다.'}
                                                                    </p>

                                                                    <div className="my-inquiry-card__answer-time-row">
                                                                        <span className="my-inquiry-card__answer-time">
                                                                            답변완료 ·{' '}
                                                                            {formatDateTime(
                                                                                detailItem.answeredAt,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <p className="my-inquiry-card__detail-empty-text">
                                                                    아직 답변이 등록되지 않았습니다.
                                                                </p>
                                                            )}
                                                        </section>
                                                    </>
                                                ) : null}
                                            </div>
                                        )}
                                    </article>
                                )
                            })}
                        </section>

                        {totalPages > 1 && (
                            <div className="my-inquiry-page__pagination">
                                <button
                                    type="button"
                                    className="my-inquiry-page__page-button"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    ‹
                                </button>

                                <span className="my-inquiry-page__page-indicator">
                                    {currentPage} / {totalPages}
                                </span>

                                <button
                                    type="button"
                                    className="my-inquiry-page__page-button"
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