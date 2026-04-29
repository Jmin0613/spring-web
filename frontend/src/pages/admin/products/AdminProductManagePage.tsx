import { type KeyboardEvent, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../../../components/SiteHeader.tsx'
import {
    fetchAdminProducts,
    type AdminProductListItem,
    type ProductStatus,
    updateAdminProductStatus,
} from '../../../api/adminProductApi.ts'
import './AdminProductManagePage.css'

const API_BASE_URL = 'http://localhost:8080'
const ITEMS_PER_PAGE = 10

type MemberInfo = {
    id: number
    loginId?: string
    name?: string
    nickname?: string
    role?: 'ADMIN' | 'USER'
}

type CategoryFilter = '전체' | '식품' | '생활' | '가전' | '뷰티·패션' | '도서'
type StatusFilter = '전체' | ProductStatus

const CATEGORY_FILTERS: CategoryFilter[] = [
    '전체',
    '식품',
    '생활',
    '가전',
    '뷰티·패션',
    '도서',
]

const STATUS_FILTERS: {
    value: StatusFilter
    label: string
}[] = [
    { value: '전체', label: '전체 상태' },
    { value: 'ON_SALE', label: '판매중' },
    { value: 'SOLD_OUT', label: '품절' },
    { value: 'HIDDEN', label: '숨김' },
]

const PRODUCT_STATUS_OPTIONS: {
    value: ProductStatus
    label: string
}[] = [
    { value: 'ON_SALE', label: '판매중' },
    { value: 'SOLD_OUT', label: '품절' },
    { value: 'HIDDEN', label: '숨김' },
]

function getProductId(product: AdminProductListItem) {
    return product.productId ?? product.id
}

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

    return `${year}.${month}.${day}`
}

function isProductModified(createdAt?: string, updatedAt?: string) {
    if (!createdAt || !updatedAt) {
        return false
    }

    const createdTime = new Date(createdAt).getTime()
    const updatedTime = new Date(updatedAt).getTime()

    if (Number.isNaN(createdTime) || Number.isNaN(updatedTime)) {
        return createdAt !== updatedAt
    }

    return Math.abs(updatedTime - createdTime) > 1000
}

function getProductStatusLabel(status: ProductStatus) {
    if (status === 'ON_SALE') return '판매중'
    if (status === 'SOLD_OUT') return '품절'
    if (status === 'HIDDEN') return '숨김'
    return status
}

function matchesCategory(product: AdminProductListItem, selectedCategory: CategoryFilter) {
    if (selectedCategory === '전체') {
        return true
    }

    if (selectedCategory === '뷰티·패션') {
        return product.category === '뷰티' || product.category === '패션'
    }

    return product.category === selectedCategory
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

export default function AdminProductManagePage() {
    const navigate = useNavigate()

    const [checkingAdmin, setCheckingAdmin] = useState(true)
    // 관리자 권한 확인 중인지 관리

    const [isAdmin, setIsAdmin] = useState(false)
    // 관리자 여부

    const [products, setProducts] = useState<AdminProductListItem[]>([])
    // 관리자 상품 목록 데이터

    const [loading, setLoading] = useState(true)
    // 상품 목록을 불러오는 중인지 관리

    const [error, setError] = useState('')
    // 상품 목록 조회 실패 메세지

    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('전체')
    // 선택한 카테고리 필터

    const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('전체')
    // 선택한 상품 상태 필터

    const [searchInput, setSearchInput] = useState('')
    // 검색창에 입력 중인 값

    const [appliedKeyword, setAppliedKeyword] = useState('')
    // 실제 검색에 적용된 값

    const [currentPage, setCurrentPage] = useState(1)
    // 현재 페이지 번호

    const [updatingProductId, setUpdatingProductId] = useState<number | null>(null)
    // 상태변경 요청 중인 상품 id. 중복 클릭 방지용.

    const [openStatusProductId, setOpenStatusProductId] = useState<number | null>(null)
    // 상태변경 드롭다운이 열려있는 상품 id.

    const filteredProducts = useMemo(() => {
        const keyword = appliedKeyword.trim().toLowerCase()

        return products.filter((product) => {
            const categoryMatched = matchesCategory(product, selectedCategory)

            const statusMatched =
                selectedStatus === '전체' || product.status === selectedStatus

            const keywordMatched =
                keyword === '' ||
                product.name.toLowerCase().includes(keyword) ||
                (product.description ?? '').toLowerCase().includes(keyword)

            return categoryMatched && statusMatched && keywordMatched
        })
    }, [products, selectedCategory, selectedStatus, appliedKeyword])

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE))

    const pagedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    }, [filteredProducts, currentPage])

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

    // 관리자 상품 목록 조회
    useEffect(() => {
        async function loadProducts() {
            try {
                setLoading(true)
                setError('')

                const data = await fetchAdminProducts()
                setProducts(data)
                setCurrentPage(1)
            } catch (error) {
                setError(getErrorMessage(error))
            } finally {
                setLoading(false)
            }
        }

        void loadProducts()
    }, [])

    // 필터/검색 결과가 줄어서 현재 페이지가 없는 페이지가 되었을 때 보정
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

    function handleChangeCategory(category: CategoryFilter) {
        setSelectedCategory(category)
        setCurrentPage(1)
    }

    function handleChangeStatus(status: StatusFilter) {
        setSelectedStatus(status)
        setCurrentPage(1)
    }

    async function handleChangeProductStatus(
        product: AdminProductListItem,
        nextStatus: ProductStatus,
    ) {
        const productId = getProductId(product)

        if (!productId) {
            alert('상태를 변경할 상품 정보를 찾을 수 없습니다.')
            return
        }

        const confirmed = window.confirm(
            `"${product.name}" 상품 상태를 "${getProductStatusLabel(nextStatus)}" 상태로 변경할까요?`,
        )

        if (!confirmed) {
            return
        }

        try {
            setUpdatingProductId(productId)

            await updateAdminProductStatus(productId, nextStatus)

            setProducts((prev) =>
                prev.map((item) =>
                    getProductId(item) === productId
                        ? {
                            ...item,
                            status: nextStatus,
                            updatedAt: new Date().toISOString(),
                        }
                        : item,
                ),
            )

            setOpenStatusProductId(null)
            alert('상품 상태가 변경되었습니다.')
        } catch (error) {
            alert(getErrorMessage(error))
        } finally {
            setUpdatingProductId(null)
        }
    }

    if (checkingAdmin) {
        return (
            <div className="admin-product-manage-page">
                <SiteHeader />

                <main className="admin-product-manage-container">
                    <div className="admin-product-manage-state-box">
                        관리자 권한을 확인하는 중입니다...
                    </div>
                </main>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="admin-product-manage-page">
                <SiteHeader />

                <main className="admin-product-manage-container">
                    <div className="admin-product-manage-state-box">
                        관리자만 접근할 수 있는 페이지입니다.
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="admin-product-manage-page">
            <SiteHeader />

            <main className="admin-product-manage-container">
                <section className="admin-product-manage-header">
                    <div>
                        <p className="admin-product-manage-eyebrow">ADMIN PRODUCT</p>
                        <h1 className="admin-product-manage-title">상품관리</h1>
                    </div>

                    <button
                        type="button"
                        className="admin-product-create-button"
                        onClick={() => navigate('/admin/products/new')}
                    >
                        상품 등록
                    </button>
                </section>

                <section className="admin-product-summary-card">
                    <div>
                        <span className="admin-product-summary-label">전체 상품</span>
                        <strong>{products.length.toLocaleString('ko-KR')}개</strong>
                    </div>

                    <div>
                        <span className="admin-product-summary-label">판매중</span>
                        <strong>
                            {products
                                .filter((product) => product.status === 'ON_SALE')
                                .length.toLocaleString('ko-KR')}
                            개
                        </strong>
                    </div>

                    <div>
                        <span className="admin-product-summary-label">품절</span>
                        <strong>
                            {products
                                .filter((product) => product.status === 'SOLD_OUT')
                                .length.toLocaleString('ko-KR')}
                            개
                        </strong>
                    </div>

                    <div>
                        <span className="admin-product-summary-label">숨김</span>
                        <strong>
                            {products
                                .filter((product) => product.status === 'HIDDEN')
                                .length.toLocaleString('ko-KR')}
                            개
                        </strong>
                    </div>
                </section>

                <section className="admin-product-toolbar">
                    <div className="admin-product-category-filter">
                        {CATEGORY_FILTERS.map((category) => (
                            <button
                                key={category}
                                type="button"
                                className={
                                    selectedCategory === category
                                        ? 'admin-product-filter-button admin-product-filter-button--active'
                                        : 'admin-product-filter-button'
                                }
                                onClick={() => handleChangeCategory(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    <div className="admin-product-toolbar-right">
                        <select
                            className="admin-product-status-select"
                            value={selectedStatus}
                            onChange={(e) =>
                                handleChangeStatus(e.target.value as StatusFilter)
                            }
                        >
                            {STATUS_FILTERS.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>

                        <input
                            className="admin-product-search-input"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="상품명 검색"
                        />

                        <button
                            type="button"
                            className="admin-product-search-button"
                            onClick={handleApplySearch}
                        >
                            검색
                        </button>
                    </div>
                </section>

                {loading ? (
                    <div className="admin-product-manage-state-box">
                        상품 목록을 불러오는 중입니다...
                    </div>
                ) : error ? (
                    <div className="admin-product-manage-state-box">{error}</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="admin-product-manage-state-box">
                        조건에 맞는 상품이 없습니다.
                    </div>
                ) : (
                    <>
                        <section className="admin-product-list">
                            {pagedProducts.map((product) => {
                                const productId = getProductId(product)
                                const isUpdating = productId === updatingProductId

                                return (
                                    <article
                                        className="admin-product-card"
                                        key={productId ?? product.name}
                                    >
                                        <div className="admin-product-card-main">
                                            <div className="admin-product-image-box">
                                                {product.imageUrl ? (
                                                    <img
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none'
                                                        }}
                                                    />
                                                ) : (
                                                    <span>상품</span>
                                                )}
                                            </div>

                                            <div className="admin-product-info">
                                                <div className="admin-product-name-row">
                                                    <strong>{product.name}</strong>
                                                    <span
                                                        className={
                                                            product.status === 'ON_SALE'
                                                                ? 'admin-product-status-badge admin-product-status-badge--on-sale'
                                                                : product.status === 'SOLD_OUT'
                                                                    ? 'admin-product-status-badge admin-product-status-badge--sold-out'
                                                                    : 'admin-product-status-badge admin-product-status-badge--hidden'
                                                        }
                                                    >
                                                        {getProductStatusLabel(product.status)}
                                                    </span>
                                                </div>

                                                <div className="admin-product-meta-row">
                                                    <span>카테고리 {product.category}</span>
                                                    <span>재고 {product.stock.toLocaleString('ko-KR')}개</span>
                                                    <span>등록일 {formatDateTime(product.createdAt)}</span>

                                                    {isProductModified(product.createdAt, product.updatedAt) && (
                                                        <span>수정일 {formatDateTime(product.updatedAt)}</span>
                                                    )}
                                                </div>

                                                {product.description && (
                                                    <p className="admin-product-description">
                                                        {product.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="admin-product-right">
                                                <div className="admin-product-price">
                                                    {formatPrice(product.price)}
                                                </div>

                                                <div className="admin-product-count-row">
                                                    <span>
                                                        구매 {product.purchaseCount ?? 0}
                                                    </span>
                                                    <span>
                                                        찜 {product.wishCount ?? 0}
                                                    </span>
                                                </div>

                                                <div className="admin-product-action-row">
                                                    <button
                                                        type="button"
                                                        className="admin-product-view-button"
                                                        onClick={() => {
                                                            if (productId) {
                                                                navigate(`/products/${productId}`)
                                                            }
                                                        }}
                                                    >
                                                        상품보기
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="admin-product-outline-button"
                                                        onClick={() => {
                                                            if (productId) {
                                                                navigate(`/admin/products/${productId}/edit`)
                                                            }
                                                        }}
                                                    >
                                                        수정
                                                    </button>

                                                    <div className="admin-product-status-dropdown">
                                                        <button
                                                            type="button"
                                                            className="admin-product-status-dropdown-button"
                                                            onClick={() => {
                                                                if (!productId) {
                                                                    return
                                                                }

                                                                setOpenStatusProductId((prev) =>
                                                                    prev === productId ? null : productId,
                                                                )
                                                            }}
                                                            disabled={isUpdating}
                                                        >
                                                            <span>현재 상태</span>
                                                            <strong>{isUpdating ? '처리 중...' : getProductStatusLabel(product.status)}</strong>
                                                            <em>{openStatusProductId === productId ? '▲' : '▼'}</em>
                                                        </button>

                                                        {productId && openStatusProductId === productId && (
                                                            <div className="admin-product-status-menu">
                                                                {PRODUCT_STATUS_OPTIONS.map((statusOption) => {
                                                                    const isCurrentStatus = product.status === statusOption.value

                                                                    return (
                                                                        <button
                                                                            key={statusOption.value}
                                                                            type="button"
                                                                            className={
                                                                                isCurrentStatus
                                                                                    ? 'admin-product-status-menu-item admin-product-status-menu-item--active'
                                                                                    : 'admin-product-status-menu-item'
                                                                            }
                                                                            onClick={() => {
                                                                                if (isCurrentStatus) {
                                                                                    setOpenStatusProductId(null)
                                                                                    return
                                                                                }

                                                                                void handleChangeProductStatus(
                                                                                    product,
                                                                                    statusOption.value,
                                                                                )
                                                                            }}
                                                                            disabled={isUpdating}
                                                                        >
                                                                            {statusOption.label}
                                                                        </button>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                )
                            })}
                        </section>

                        {totalPages > 1 && (
                            <div className="admin-product-pagination">
                                <button
                                    type="button"
                                    className="admin-product-page-button"
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
                                                ? 'admin-product-page-button admin-product-page-button--active'
                                                : 'admin-product-page-button'
                                        }
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    className="admin-product-page-button"
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