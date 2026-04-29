import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../../../components/SiteHeader.tsx'
import {
    answerAdminInquiry,
    type AdminInquiryDetail,
    type AdminInquiryListItem,
    fetchAdminInquiries,
    fetchAdminInquiryDetail,
    type InquiryStatus,
} from '../../../api/adminInquiryApi.ts'
import './AdminInquiryPage.css'

const API_BASE_URL = 'http://localhost:8080'
const ITEMS_PER_PAGE = 10

// 관리자인지 아닌지 확인용도
type MemberInfo = {
    id: number
    loginId?: string
    name?: string
    nickname?: string
    role?: 'ADMIN' | 'USER'
}

function formatDateTime(dateTime: string | null) {
    if (!dateTime) {
        return '-'
    }

    const date = new Date(dateTime)

    if (Number.isNaN(date.getTime())) {
        return dateTime
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')

    return `${year}.${month}.${day} ${hour}:${minute}`
}

function getInquiryStatusLabel(status: InquiryStatus) {
    if (status === 'WAITING') return '답변대기'
    if (status === 'ANSWERED') return '답변완료'
    return status
}

function getErrorMessage(error: unknown) {
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

    return '요청 처리 중 오류가 발생했습니다.'
}

export default function AdminInquiryPage() {
    const navigate = useNavigate()

    const [checkingAdmin, setCheckingAdmin] = useState(true)
    // 관리자 권한 확인 중인지 관리

    const [isAdmin, setIsAdmin] = useState(false)
    // 관리자 여부

    const [inquiries, setInquiries] = useState<AdminInquiryListItem[]>([])
    // 관리자 문의 목록 데이터

    const [loading, setLoading] = useState(true)
    // 문의 목록을 불러오는 중인지 관리

    const [error, setError] = useState('')
    // 문의 목록 조회 실패 메세지

    const [openInquiryId, setOpenInquiryId] = useState<number | null>(null)
    // 현재 상세보기가 열려있는 문의 id

    const [inquiryDetailMap, setInquiryDetailMap] = useState<Record<number, AdminInquiryDetail>>({})
    // 한 번 조회한 문의 상세 데이터를 문의 id별로 저장

    const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null)
    // 특정 문의 상세 정보를 불러오는 중인지 관리

    const [detailErrorMap, setDetailErrorMap] = useState<Record<number, string>>({})
    // 특정 문의 상세 조회 실패 메세지 저장

    const [answerMap, setAnswerMap] = useState<Record<number, string>>({})
    // 문의 id별 답변 입력값 저장

    const [submittingInquiryId, setSubmittingInquiryId] = useState<number | null>(null)
    // 답변 등록 중인 문의 id. 중복 클릭 방지용.

    const [currentPage, setCurrentPage] = useState(1)
    // 현재 페이지 번호

    const totalPages = Math.max(1, Math.ceil(inquiries.length / ITEMS_PER_PAGE))

    const pagedInquiries = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        return inquiries.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    }, [inquiries, currentPage])

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

    // 관리자 권한 확인
    useEffect(() => {
        async function checkAdmin() {
            try {
                const response = await axios.get<MemberInfo | null>(
                    `${API_BASE_URL}/member/myinfo`,
                    {
                        withCredentials: true,
                    },
                )

                setIsAdmin(response.data?.role === 'ADMIN')
            } catch (error) {
                setIsAdmin(false)
            } finally {
                setCheckingAdmin(false)
            }
        }

        void checkAdmin()
    }, [])

    // 관리자 문의 목록 조회
    useEffect(() => {
        async function loadInquiries() {
            try {
                setLoading(true)
                setError('')

                const data = await fetchAdminInquiries()
                setInquiries(data)
                setCurrentPage(1)
            } catch (error) {
                setError(getErrorMessage(error))
            } finally {
                setLoading(false)
            }
        }

        void loadInquiries()
    }, [])

    // 문의 상세 열기/닫기
    async function handleToggleDetail(inquiryId: number) {
        if (openInquiryId === inquiryId) {
            setOpenInquiryId(null)
            return
        }

        if (inquiryDetailMap[inquiryId]) {
            setOpenInquiryId(inquiryId)
            return
        }

        try {
            setDetailLoadingId(inquiryId)
            setDetailErrorMap((prev) => {
                const next = { ...prev }
                delete next[inquiryId]
                return next
            })

            const detail = await fetchAdminInquiryDetail(inquiryId)

            setInquiryDetailMap((prev) => ({
                ...prev,
                [inquiryId]: detail,
            }))

            setAnswerMap((prev) => ({
                ...prev,
                [inquiryId]: detail.answerContent ?? '',
            }))

            setOpenInquiryId(inquiryId)
        } catch (error) {
            setDetailErrorMap((prev) => ({
                ...prev,
                [inquiryId]: getErrorMessage(error),
            }))

            setOpenInquiryId(inquiryId)
        } finally {
            setDetailLoadingId(null)
        }
    }

    // 답변 입력값 변경
    function handleChangeAnswer(inquiryId: number, value: string) {
        setAnswerMap((prev) => ({
            ...prev,
            [inquiryId]: value,
        }))
    }

    // 관리자 문의 답변 등록
    async function handleSubmitAnswer(detail: AdminInquiryDetail) {
        const answerContent = answerMap[detail.inquiryId]?.trim() ?? ''

        if (!answerContent) {
            alert('답변 내용을 입력해주세요.')
            return
        }

        const confirmed = window.confirm('해당 문의에 답변을 등록할까요?')

        if (!confirmed) {
            return
        }

        try {
            setSubmittingInquiryId(detail.inquiryId)

            await answerAdminInquiry(
                detail.productId,
                detail.inquiryId,
                {
                    answerContent,
                },
            )

            alert('답변이 등록되었습니다.')

            const updatedDetail = await fetchAdminInquiryDetail(detail.inquiryId)
            const updatedList = await fetchAdminInquiries()

            setInquiryDetailMap((prev) => ({
                ...prev,
                [detail.inquiryId]: updatedDetail,
            }))

            setAnswerMap((prev) => ({
                ...prev,
                [detail.inquiryId]: updatedDetail.answerContent ?? '',
            }))

            setInquiries(updatedList)
        } catch (error) {
            alert(getErrorMessage(error))
        } finally {
            setSubmittingInquiryId(null)
        }
    }

    if (checkingAdmin) {
        return (
            <div className="admin-inquiry-page">
                <SiteHeader />
                <main className="admin-inquiry-container">
                    <div className="admin-inquiry-state-box">
                        관리자 권한을 확인하는 중입니다...
                    </div>
                </main>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="admin-inquiry-page">
                <SiteHeader />
                <main className="admin-inquiry-container">
                    <div className="admin-inquiry-state-box">
                        관리자만 접근할 수 있는 페이지입니다.
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="admin-inquiry-page">
            <SiteHeader />

            <main className="admin-inquiry-container">
                <section className="admin-inquiry-header">
                    <p className="admin-inquiry-eyebrow">ADMIN INQUIRY</p>
                    <h1 className="admin-inquiry-title">문의답변</h1>
                </section>

                <section className="admin-inquiry-summary-card">
                    <div>
                        <span className="admin-inquiry-summary-label">전체 문의</span>
                        <strong>{inquiries.length.toLocaleString('ko-KR')}건</strong>
                    </div>

                    <div>
                        <span className="admin-inquiry-summary-label">답변대기</span>
                        <strong>
                            {inquiries
                                .filter((inquiry) => inquiry.status === 'WAITING')
                                .length.toLocaleString('ko-KR')}
                            건
                        </strong>
                    </div>

                    <div>
                        <span className="admin-inquiry-summary-label">답변완료</span>
                        <strong>
                            {inquiries
                                .filter((inquiry) => inquiry.status === 'ANSWERED')
                                .length.toLocaleString('ko-KR')}
                            건
                        </strong>
                    </div>

                    <div>
                        <span className="admin-inquiry-summary-label">비밀글</span>
                        <strong>
                            {inquiries
                                .filter((inquiry) => inquiry.secret)
                                .length.toLocaleString('ko-KR')}
                            건
                        </strong>
                    </div>
                </section>

                {loading ? (
                    <div className="admin-inquiry-state-box">
                        문의 목록을 불러오는 중입니다...
                    </div>
                ) : error ? (
                    <div className="admin-inquiry-state-box">{error}</div>
                ) : inquiries.length === 0 ? (
                    <div className="admin-inquiry-state-box">
                        등록된 문의가 없습니다.
                    </div>
                ) : (
                    <>
                        <section className="admin-inquiry-list">
                            {pagedInquiries.map((inquiry) => {
                                const detail = inquiryDetailMap[inquiry.inquiryId]
                                const isOpen = openInquiryId === inquiry.inquiryId
                                const isDetailLoading = detailLoadingId === inquiry.inquiryId
                                const detailError = detailErrorMap[inquiry.inquiryId]
                                const isSubmitting = submittingInquiryId === inquiry.inquiryId

                                return (
                                    <article
                                        className="admin-inquiry-card"
                                        key={inquiry.inquiryId}
                                    >
                                        <div className="admin-inquiry-card-main">
                                            <div className="admin-inquiry-card-left">
                                                <div className="admin-inquiry-title-row">
                                                    <strong>{inquiry.title}</strong>
                                                    {inquiry.secret && (
                                                        <span className="admin-inquiry-secret-badge">
                                                            비밀글
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="admin-inquiry-badge-row">
                                                    <span
                                                        className={
                                                            inquiry.status === 'ANSWERED'
                                                                ? 'admin-inquiry-badge admin-inquiry-badge--answered'
                                                                : 'admin-inquiry-badge admin-inquiry-badge--waiting'
                                                        }
                                                    >
                                                        {getInquiryStatusLabel(inquiry.status)}
                                                    </span>

                                                    <span className="admin-inquiry-badge">
                                                        문의번호 {inquiry.inquiryId}
                                                    </span>
                                                </div>

                                                <div className="admin-inquiry-meta-row">
                                                    <span>상품 {inquiry.productNameSnapshot}</span>
                                                    <span>작성자 {inquiry.writerNickName ?? inquiry.writerName}</span>
                                                    <span>작성일 {formatDateTime(inquiry.createdAt)}</span>
                                                </div>
                                            </div>

                                            <div className="admin-inquiry-card-right">
                                                <button
                                                    type="button"
                                                    className="admin-inquiry-product-button"
                                                    onClick={() => navigate(`/products/${inquiry.productId}`)}
                                                >
                                                    상품보기
                                                </button>

                                                <button
                                                    type="button"
                                                    className="admin-inquiry-detail-button"
                                                    onClick={() => handleToggleDetail(inquiry.inquiryId)}
                                                >
                                                    {isOpen ? '상세 닫기' : '상세보기'}
                                                </button>
                                            </div>
                                        </div>

                                        {isOpen && (
                                            <div className="admin-inquiry-detail-panel">
                                                {isDetailLoading ? (
                                                    <div className="admin-inquiry-detail-state">
                                                        문의 상세를 불러오는 중입니다...
                                                    </div>
                                                ) : detailError ? (
                                                    <div className="admin-inquiry-detail-state admin-inquiry-detail-state--error">
                                                        {detailError}
                                                    </div>
                                                ) : detail ? (
                                                    <>
                                                        <div className="admin-inquiry-detail-grid">
                                                            <section className="admin-inquiry-detail-section">
                                                                <h3>문의 정보</h3>
                                                                <div className="admin-inquiry-detail-divider" />

                                                                <div className="admin-inquiry-info-list">
                                                                    <p>
                                                                        <span className="admin-inquiry-info-label">상품</span>
                                                                        <span>{detail.productNameSnapshot}</span>
                                                                    </p>
                                                                    <p>
                                                                        <span className="admin-inquiry-info-label">제목</span>
                                                                        <span>{detail.title}</span>
                                                                    </p>
                                                                    <p>
                                                                        <span className="admin-inquiry-info-label">상태</span>
                                                                        <span>{getInquiryStatusLabel(detail.status)}</span>
                                                                    </p>
                                                                    <p>
                                                                        <span className="admin-inquiry-info-label">비밀글</span>
                                                                        <span>{detail.secret ? 'Yes' : 'No'}</span>
                                                                    </p>
                                                                </div>
                                                            </section>

                                                            <section className="admin-inquiry-detail-section">
                                                                <h3>작성자 정보</h3>
                                                                <div className="admin-inquiry-detail-divider" />

                                                                <div className="admin-inquiry-info-list">
                                                                    <p>
                                                                        <span className="admin-inquiry-info-label">이름</span>
                                                                        <span>{detail.writerName}</span>
                                                                    </p>
                                                                    <p>
                                                                        <span className="admin-inquiry-info-label">닉네임</span>
                                                                        <span>{detail.writerNickName ?? '-'}</span>
                                                                    </p>
                                                                    <p>
                                                                        <span className="admin-inquiry-info-label">작성일</span>
                                                                        <span>{formatDateTime(detail.createdAt)}</span>
                                                                    </p>
                                                                    <p>
                                                                        <span className="admin-inquiry-info-label">답변일</span>
                                                                        <span>{formatDateTime(detail.answeredAt)}</span>
                                                                    </p>
                                                                </div>
                                                            </section>
                                                        </div>

                                                        <section className="admin-inquiry-content-section">
                                                            <h3>문의 내용</h3>
                                                            <div className="admin-inquiry-content-box">
                                                                {detail.content}
                                                            </div>
                                                        </section>

                                                        <section className="admin-inquiry-answer-section">
                                                            <h3>관리자 답변</h3>

                                                            {detail.status === 'ANSWERED' ? (
                                                                <div className="admin-inquiry-answer-complete-box">
                                                                    {detail.answerContent}
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <textarea
                                                                        className="admin-inquiry-answer-textarea"
                                                                        value={answerMap[detail.inquiryId] ?? ''}
                                                                        onChange={(e) =>
                                                                            handleChangeAnswer(
                                                                                detail.inquiryId,
                                                                                e.target.value,
                                                                            )
                                                                        }
                                                                        placeholder="문의에 대한 답변을 입력해주세요."
                                                                    />

                                                                    <div className="admin-inquiry-answer-button-row">
                                                                        <button
                                                                            type="button"
                                                                            className="admin-inquiry-answer-button"
                                                                            onClick={() => handleSubmitAnswer(detail)}
                                                                            disabled={isSubmitting}
                                                                        >
                                                                            {isSubmitting ? '답변 등록 중...' : '답변 등록'}
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </section>
                                                    </>
                                                ) : (
                                                    <div className="admin-inquiry-detail-state">
                                                        문의 상세 정보를 찾을 수 없습니다.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </article>
                                )
                            })}
                        </section>

                        {totalPages > 1 && (
                            <div className="admin-inquiry-pagination">
                                <button
                                    type="button"
                                    className="admin-inquiry-page-button"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    이전
                                </button>

                                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        className={
                                            page === currentPage
                                                ? 'admin-inquiry-page-button admin-inquiry-page-button--active'
                                                : 'admin-inquiry-page-button'
                                        }
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    className="admin-inquiry-page-button"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    다음
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}