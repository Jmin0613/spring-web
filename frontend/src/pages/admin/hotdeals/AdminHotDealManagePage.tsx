import { type KeyboardEvent, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../../../components/SiteHeader.tsx'
import {
    fetchAdminHotDeals,
    resumeAdminHotDeal,
    stopAdminHotDeal,
    type AdminHotDealListItem,
    type HotDealStatus,
} from '../../../api/adminHotDealApi.ts'
import './AdminHotDealManagePage.css'

const API_BASE_URL = 'http://localhost:8080'
const ITEMS_PER_PAGE = 10

type MemberInfo = {
    id: number
    loginId?: string
    name?: string
    nickname?: string
    role?: 'ADMIN' | 'USER'
}

type StatusFilter = '전체' | HotDealStatus

const STATUS_FILTERS: {
    value: StatusFilter
    label: string
}[] = [
    { value: '전체', label: '전체 상태' },
    { value: 'READY', label: '오픈예정' },
    { value: 'ON_SALE', label: '진행중' },
    { value: 'ENDED', label: '종료' },
    { value: 'STOPPED', label: '중단' },
]

function formatPrice(price: number) {
    return `${price.toLocaleString('ko-KR')}원`
}

function formatDateTime(dateTime?: string) {
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

function getHotDealStatusLabel(status: HotDealStatus) {
    if (status === 'READY') return '오픈예정'
    if (status === 'ON_SALE') return '진행중'
    if (status === 'ENDED') return '종료'
    if (status === 'STOPPED') return '중단'
    return status
}

function getStatusBadgeClassName(status: HotDealStatus) {
    if (status === 'READY') {
        return 'admin-hotdeal-status-badge admin-hotdeal-status-badge--ready'
    }

    if (status === 'ON_SALE') {
        return 'admin-hotdeal-status-badge admin-hotdeal-status-badge--on-sale'
    }

    if (status === 'ENDED') {
        return 'admin-hotdeal-status-badge admin-hotdeal-status-badge--ended'
    }

    if (status === 'STOPPED') {
        return 'admin-hotdeal-status-badge admin-hotdeal-status-badge--stopped'
    }

    return 'admin-hotdeal-status-badge'
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

function AdminHotDealImage({
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
        return <span className="admin-hotdeal-image-placeholder">이미지 없음</span>
    }

    return (
        <img
            className="admin-hotdeal-image-img"
            src={imageUrl}
            alt={alt}
            onError={() => setImageError(true)}
        />
    )
}

export default function AdminHotDealManagePage() {
    const navigate = useNavigate()

    const [checkingAdmin, setCheckingAdmin] = useState(true)
    // 관리자 권한 확인 중인지 관리

    const [isAdmin, setIsAdmin] = useState(false)
    // 관리자 여부

    const [hotDeals, setHotDeals] = useState<AdminHotDealListItem[]>([])
    // 관리자 핫딜 목록 데이터

    const [loading, setLoading] = useState(true)
    // 핫딜 목록 조회 중인지 관리

    const [error, setError] = useState('')
    // 핫딜 목록 조회 실패 메세지

    const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('전체')
    // 선택한 핫딜 상태 필터

    const [searchInput, setSearchInput] = useState('')
    // 검색창 입력값

    const [appliedKeyword, setAppliedKeyword] = useState('')
    // 실제 검색에 적용된 키워드

    const [currentPage, setCurrentPage] = useState(1)
    // 현재 페이지 번호

    const [updatingHotDealId, setUpdatingHotDealId] = useState<number | null>(null)
    // 중단/재개 요청 중인 핫딜 id

    const sortedHotDeals = useMemo(() => {
        return [...hotDeals].sort((a, b) => {
            const aTime = new Date(a.createdAt).getTime()
            const bTime = new Date(b.createdAt).getTime()

            if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
                return b.hotDealId - a.hotDealId
            }

            return bTime - aTime
        })
    }, [hotDeals])

    const filteredHotDeals = useMemo(() => {
        const keyword = appliedKeyword.trim().toLowerCase()

        return sortedHotDeals.filter((hotDeal) => {
            const statusMatched =
                selectedStatus === '전체' || hotDeal.status === selectedStatus

            const keywordMatched =
                keyword === '' ||
                hotDeal.productName.toLowerCase().includes(keyword)

            return statusMatched && keywordMatched
        })
    }, [sortedHotDeals, selectedStatus, appliedKeyword])

    const totalPages = Math.max(1, Math.ceil(filteredHotDeals.length / ITEMS_PER_PAGE))

    const pagedHotDeals = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredHotDeals.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    }, [filteredHotDeals, currentPage])

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

    // 관리자 핫딜 목록 조회
    useEffect(() => {
        async function loadHotDeals() {
            try {
                setLoading(true)
                setError('')

                const data = await fetchAdminHotDeals()
                setHotDeals(data)
                setCurrentPage(1)
            } catch (error) {
                setError(getErrorMessage(error))
            } finally {
                setLoading(false)
            }
        }

        void loadHotDeals()
    }, [])

    // 필터 결과가 줄어서 현재 페이지가 없는 페이지가 되었을 때 보정
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

    function handleApplySearch() {
        setAppliedKeyword(searchInput.trim())
        setCurrentPage(1)
    }

    function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            handleApplySearch()
        }
    }

    function handleChangeStatus(status: StatusFilter) {
        setSelectedStatus(status)
        setCurrentPage(1)
    }

    async function handleStopHotDeal(hotDeal: AdminHotDealListItem) {
        const confirmed = window.confirm(
            `"${hotDeal.productName}" 핫딜을 긴급 중단할까요?`,
        )

        if (!confirmed) {
            return
        }

        try {
            setUpdatingHotDealId(hotDeal.hotDealId)

            await stopAdminHotDeal(hotDeal.hotDealId)

            setHotDeals((prev) =>
                prev.map((item) =>
                    item.hotDealId === hotDeal.hotDealId
                        ? {
                            ...item,
                            status: 'STOPPED',
                        }
                        : item,
                ),
            )

            alert('핫딜이 긴급 중단되었습니다.')
        } catch (error) {
            alert(getErrorMessage(error))
        } finally {
            setUpdatingHotDealId(null)
        }
    }

    async function handleResumeHotDeal(hotDeal: AdminHotDealListItem) {
        const confirmed = window.confirm(
            `"${hotDeal.productName}" 핫딜 중단을 해제할까요?`,
        )

        if (!confirmed) {
            return
        }

        try {
            setUpdatingHotDealId(hotDeal.hotDealId)

            await resumeAdminHotDeal(hotDeal.hotDealId)

            // 재개 후 실제 상태는 시간에 따라 READY 또는 ON_SALE이 될 수 있어서 다시 조회
            const data = await fetchAdminHotDeals()
            setHotDeals(data)

            alert('핫딜 중단이 해제되었습니다.')
        } catch (error) {
            alert(getErrorMessage(error))
        } finally {
            setUpdatingHotDealId(null)
        }
    }

    if (checkingAdmin) {
        return (
            <div className="admin-hotdeal-manage-page">
                <SiteHeader />

                <main className="admin-hotdeal-manage-container">
                    <div className="admin-hotdeal-manage-state-box">
                        관리자 권한을 확인하는 중입니다...
                    </div>
                </main>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="admin-hotdeal-manage-page">
                <SiteHeader />

                <main className="admin-hotdeal-manage-container">
                    <div className="admin-hotdeal-manage-state-box">
                        관리자만 접근할 수 있는 페이지입니다.
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="admin-hotdeal-manage-page">
            <SiteHeader />

            <main className="admin-hotdeal-manage-container">
                <section className="admin-hotdeal-manage-header">
                    <div>
                        <p className="admin-hotdeal-manage-eyebrow">ADMIN HOTDEAL</p>
                        <h1 className="admin-hotdeal-manage-title">핫딜관리</h1>
                    </div>

                    <button
                        type="button"
                        className="admin-hotdeal-create-button"
                        onClick={() => navigate('/admin/hotdeals/new')}
                    >
                        핫딜 등록
                    </button>
                </section>

                <section className="admin-hotdeal-summary-card">
                    <div>
                        <span className="admin-hotdeal-summary-label">전체 핫딜</span>
                        <strong>{hotDeals.length.toLocaleString('ko-KR')}개</strong>
                    </div>

                    <div>
                        <span className="admin-hotdeal-summary-label">진행중</span>
                        <strong>
                            {hotDeals
                                .filter((hotDeal) => hotDeal.status === 'ON_SALE')
                                .length.toLocaleString('ko-KR')}
                            개
                        </strong>
                    </div>

                    <div>
                        <span className="admin-hotdeal-summary-label">오픈예정</span>
                        <strong>
                            {hotDeals
                                .filter((hotDeal) => hotDeal.status === 'READY')
                                .length.toLocaleString('ko-KR')}
                            개
                        </strong>
                    </div>

                    <div>
                        <span className="admin-hotdeal-summary-label">중단</span>
                        <strong>
                            {hotDeals
                                .filter((hotDeal) => hotDeal.status === 'STOPPED')
                                .length.toLocaleString('ko-KR')}
                            개
                        </strong>
                    </div>
                </section>

                <section className="admin-hotdeal-toolbar">
                    <div className="admin-hotdeal-toolbar-right">
                        <select
                            className="admin-hotdeal-status-select"
                            value={selectedStatus}
                            onChange={(e) => handleChangeStatus(e.target.value as StatusFilter)}
                        >
                            {STATUS_FILTERS.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>

                        <input
                            className="admin-hotdeal-search-input"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="상품명 검색"
                        />

                        <button
                            type="button"
                            className="admin-hotdeal-search-button"
                            onClick={handleApplySearch}
                        >
                            검색
                        </button>
                    </div>
                </section>

                {loading ? (
                    <div className="admin-hotdeal-manage-state-box">
                        핫딜 목록을 불러오는 중입니다...
                    </div>
                ) : error ? (
                    <div className="admin-hotdeal-manage-state-box">{error}</div>
                ) : filteredHotDeals.length === 0 ? (
                    <div className="admin-hotdeal-manage-state-box">
                        조건에 맞는 핫딜이 없습니다.
                    </div>
                ) : (
                    <>
                        <section className="admin-hotdeal-list">
                            {pagedHotDeals.map((hotDeal) => {
                                const isUpdating = updatingHotDealId === hotDeal.hotDealId
                                const isStopped = hotDeal.status === 'STOPPED'
                                const isEnded = hotDeal.status === 'ENDED'

                                return (
                                    <article
                                        key={hotDeal.hotDealId}
                                        className="admin-hotdeal-card"
                                    >
                                        <div className="admin-hotdeal-card-main">
                                            <div className="admin-hotdeal-image-box">
                                                <AdminHotDealImage
                                                    imageUrl={hotDeal.imageUrl}
                                                    alt={hotDeal.productName}
                                                />
                                            </div>

                                            <div className="admin-hotdeal-info">
                                                <div className="admin-hotdeal-name-row">
                                                    <strong>{hotDeal.productName}</strong>
                                                    <span className={getStatusBadgeClassName(hotDeal.status)}>
                                                        {getHotDealStatusLabel(hotDeal.status)}
                                                    </span>
                                                    <span className="admin-hotdeal-discount-badge">
                                                        -{hotDeal.discountRate}%
                                                    </span>
                                                </div>

                                                <div className="admin-hotdeal-price-row">
                                                    <span className="admin-hotdeal-original-price">
                                                        원가 {formatPrice(hotDeal.originalPrice)}
                                                    </span>
                                                    <span className="admin-hotdeal-hot-price">
                                                        핫딜가 {formatPrice(hotDeal.hotDealPrice)}
                                                    </span>
                                                    <span>
                                                        핫딜 재고 {hotDeal.hotDealStock.toLocaleString('ko-KR')}개
                                                    </span>
                                                </div>

                                                <div className="admin-hotdeal-meta-row">
                                                    <span>시작 {formatDateTime(hotDeal.startTime)}</span>
                                                    <span>종료 {formatDateTime(hotDeal.endTime)}</span>
                                                    <span>등록일 {formatDateTime(hotDeal.createdAt)}</span>
                                                </div>
                                            </div>

                                            <div className="admin-hotdeal-right">
                                                <button
                                                    type="button"
                                                    className="admin-hotdeal-view-button"
                                                    onClick={() => navigate(`/products/${hotDeal.productId}`)}
                                                >
                                                    상품보기
                                                </button>

                                                <button
                                                    type="button"
                                                    className="admin-hotdeal-outline-button"
                                                    onClick={() =>
                                                        navigate(`/admin/hotdeals/${hotDeal.hotDealId}/edit`)
                                                    }
                                                >
                                                    수정
                                                </button>

                                                {isStopped ? (
                                                    <button
                                                        type="button"
                                                        className="admin-hotdeal-resume-button"
                                                        onClick={() => handleResumeHotDeal(hotDeal)}
                                                        disabled={isUpdating}
                                                    >
                                                        {isUpdating ? '처리 중...' : '중단해제'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="admin-hotdeal-stop-button"
                                                        onClick={() => handleStopHotDeal(hotDeal)}
                                                        disabled={isUpdating || isEnded}
                                                    >
                                                        {isUpdating ? '처리 중...' : '긴급중단'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                )
                            })}
                        </section>

                        {totalPages > 1 && (
                            <div className="admin-hotdeal-pagination">
                                <button
                                    type="button"
                                    className="admin-hotdeal-page-button"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    이전
                                </button>

                                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                                    (page) => (
                                        <button
                                            key={page}
                                            type="button"
                                            className={
                                                page === currentPage
                                                    ? 'admin-hotdeal-page-button admin-hotdeal-page-button--active'
                                                    : 'admin-hotdeal-page-button'
                                            }
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </button>
                                    ),
                                )}

                                <button
                                    type="button"
                                    className="admin-hotdeal-page-button"
                                    onClick={() =>
                                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                                    }
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