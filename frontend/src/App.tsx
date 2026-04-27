import { type KeyboardEvent, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link, Route, Routes } from 'react-router-dom'
import NoticeListPage from './pages/NoticeListPage'
import NoticeDetailPage from './pages/NoticeDetailPage'
import HotDealDetailPage from './pages/HotDealDetailPage'
import ProductDetailPage from './pages/ProductDetailPage'
import LoginPage from './pages/LoginPage'
import SiteHeader from './components/SiteHeader'
import SignupPage from './pages/SignupPage'
import CartPage from './pages/CartPage'
import OrderSheetPage from './pages/OrderSheetPage'
import OrderDetailPage from './pages/OrderDetailPage'
import OrderListPage from './pages/OrderListPage'
import WishlistPage from './pages/WishlistPage'
import MyInquiryPage from './pages/MyInquiryPage'
import MyReviewPage from './pages/MyReviewPage'
import MyPage from './pages/MyPage'
import MyPagePasswordCheck from './pages/MyPagePasswordCheck.tsx'
import MyPageEditMyInfo from './pages/MyPageEditMyInfo'
import ReviewCreatePage from './pages/ReviewCreatePage'

type HotDealApiItem = {
    hotDealId: number
    productId?: number
    productName?: string
    originalPrice: number
    hotDealPrice: number
    discountRate: number
    imageUrl: string | null
    startTime: string
    endTime: string
    status: string
}

type ProductApiItem = {
    id: number
    category: string
    imageUrl: string | null
    name: string
    price: number
    status: string
    purchaseCount: number
}

type ProductSortType = 'LATEST' | 'BEST'

const API_BASE_URL = 'http://localhost:8080'
const productCategories = ['전체', '식품', '생활', '가전', '뷰티·패션', '도서']

function formatPrice(price: number) {
    return `${price.toLocaleString('ko-KR')}원`
}

function formatOpenDateTime(dateTime: string) {
    const date = new Date(dateTime)

    if (Number.isNaN(date.getTime())) {
        return `오픈 : ${dateTime}`
    }

    return `오픈 : ${date.toLocaleString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })}`
}

function getHotDealName(item: HotDealApiItem) {
    return item.productName ?? '이름 없는 핫딜'
}

function getHotDealBadge(status: string) {
    if (status === 'ON_SALE') {
        return '특가 진행중'
    }

    if (status === 'READY') {
        return '오픈예정'
    }

    return status
}

function getHotDealEmoji(name?: string) {
    if (!name) {
        return '🎁'
    }
    return '🎁'
}

function getProductEmoji(name?: string, category?: string) {
    if (!name && !category) {
        return '🎁'
    }

    if (name?.includes('강아지')) {
        return '🐶'
    }

    if (name?.includes('고양이')) {
        return '🐱'
    }

    if (name?.includes('노트북')) {
        return '💻'
    }

    if (name?.includes('비타민')) {
        return '🍊'
    }

    if (category === 'Doll') {
        return '🧸'
    }

    return '🎁'
}

function getProductSubText(status: string, category: string) {
    if (status === 'ON_SALE') {
        return `현재 판매중 · ${category}`
    }

    if (status === 'SOLD_OUT') {
        return `품절 상태 · ${category}`
    }

    return `상품 상태 ${status} · ${category}`
}

function matchesProductCategory(product: ProductApiItem, selectedCategory: string) {
    if (selectedCategory === '전체') {
        return true
    }

    if (selectedCategory === '식품') {
        return product.category === 'Food' || product.category === '식품'
    }

    if (selectedCategory === '생활') {
        return product.category === 'Life' || product.category === '생활'
    }

    if (selectedCategory === '가전') {
        return product.category === 'Electronics' || product.category === '가전'
    }

    if (selectedCategory === '뷰티·패션') {
        return (
            product.category === 'Beauty' ||
            product.category === 'Fashion' ||
            product.category === '뷰티' ||
            product.category === '패션'
        )
    }

    if (selectedCategory === '도서') {
        return (
            product.category === 'Book' ||
            product.category === 'Books' ||
            product.category === '도서'
        )
    }

    return true
}

function HomePage() {
    const [hotDeals, setHotDeals] = useState<HotDealApiItem[]>([])
    const [hotDealsLoading, setHotDealsLoading] = useState(true)
    const [hotDealsError, setHotDealsError] = useState('')

    const [products, setProducts] = useState<ProductApiItem[]>([])
    const [productsLoading, setProductsLoading] = useState(true)
    const [productsError, setProductsError] = useState('')

    const [selectedProductCategory, setSelectedProductCategory] = useState('전체')
    const [selectedProductSort, setSelectedProductSort] = useState<ProductSortType>('LATEST')
    const [productSearchInput, setProductSearchInput] = useState('')
    const [appliedProductSearchKeyword, setAppliedProductSearchKeyword] = useState('')
    const [hotDealPage, setHotDealPage] = useState(0)
    const [readyHotDealPage, setReadyHotDealPage] = useState(0)

    function handleApplyProductSearch() {
        setAppliedProductSearchKeyword(productSearchInput.trim())
    }

    function handleProductSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            handleApplyProductSearch()
        }
    }

    useEffect(() => {
        async function loadHotDeals() {
            try {
                const response = await axios.get<HotDealApiItem[]>(`${API_BASE_URL}/hotdeals`)
                setHotDeals(response.data)
            } catch (error) {
                setHotDealsError('핫딜 상품을 불러오지 못했습니다.')
            } finally {
                setHotDealsLoading(false)
            }
        }

        void loadHotDeals()
    }, [])

    useEffect(() => {
        async function loadProducts() {
            try {
                setProductsLoading(true)
                setProductsError('')

                const response = await axios.get<ProductApiItem[]>(`${API_BASE_URL}/products`, {
                    params: {
                        sort: selectedProductSort,
                    },
                })
                setProducts(response.data)
            } catch (error) {
                setProductsError('일반 상품을 불러오지 못했습니다.')
            } finally {
                setProductsLoading(false)
            }
        }

        void loadProducts()
    }, [selectedProductSort])

    const onSaleHotDeals = useMemo(() => {
        return hotDeals.filter((item) => item.status === 'ON_SALE')
    }, [hotDeals])

    const readyHotDeals = useMemo(() => {
        return hotDeals.filter((item) => item.status === 'READY')
    }, [hotDeals])

    const hotDealsPerPage = 4
    const hotDealPageCount = Math.max(1, Math.ceil(onSaleHotDeals.length / hotDealsPerPage))
    const visibleHotDeals = onSaleHotDeals.slice(
        hotDealPage * hotDealsPerPage,
        hotDealPage * hotDealsPerPage + hotDealsPerPage,
    )

    const readyHotDealsPerPage = 4
    const readyHotDealPageCount = Math.max(1, Math.ceil(readyHotDeals.length / readyHotDealsPerPage))
    const visibleReadyHotDeals = readyHotDeals.slice(
        readyHotDealPage * readyHotDealsPerPage,
        readyHotDealPage * readyHotDealsPerPage + readyHotDealsPerPage,
    )

    useEffect(() => {
        if (hotDealPage > hotDealPageCount - 1) {
            setHotDealPage(0)
        }
    }, [hotDealPage, hotDealPageCount])

    useEffect(() => {
        if (readyHotDealPage > readyHotDealPageCount - 1) {
            setReadyHotDealPage(0)
        }
    }, [readyHotDealPage, readyHotDealPageCount])

    const filteredProducts = useMemo(() => {
        return products.filter((item) => {
            const categoryMatched = matchesProductCategory(item, selectedProductCategory)
            const keywordMatched =
                appliedProductSearchKeyword === '' ||
                item.name.toLowerCase().includes(appliedProductSearchKeyword.toLowerCase())

            return categoryMatched && keywordMatched
        })
    }, [products, selectedProductCategory, appliedProductSearchKeyword])

    const popularProductIds = useMemo(() => {
        return new Set(
            products
                .filter((item) => item.purchaseCount > 0)
                .sort((a, b) => {
                    if (b.purchaseCount !== a.purchaseCount) {
                        return b.purchaseCount - a.purchaseCount
                    }

                    return b.id - a.id
                })
                .slice(0, 5)
                .map((item) => item.id),
        )
    }, [products])

    return (
        <div
            style={{
                backgroundColor: '#ffffff',
                minHeight: '100vh',
                color: '#111827',
            }}
        >
            <SiteHeader />

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 24px 96px' }}>
                <section
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: '22px',
                        textAlign: 'center',
                    }}
                >
                    <div>
                        <p
                            style={{
                                margin: 0,
                                color: '#d19a00',
                                fontSize: '14px',
                                fontWeight: 800,
                                letterSpacing: '.08em',
                            }}
                        >
                            TODAY DEAL
                        </p>

                        <h1
                            style={{
                                margin: '4px 0 0',
                                fontSize: '40px',
                                fontWeight: 800,
                                lineHeight: 1.2,
                                letterSpacing: '-0.02em',
                                color: '#111827',
                            }}
                        >
                            오늘의 추천 딜
                        </h1>
                    </div>
                </section>

                <SectionTitle title="진행 중인 핫딜" />

                {hotDealsLoading ? (
                    <div style={stateBoxStyle}>핫딜 상품을 불러오는 중입니다...</div>
                ) : hotDealsError ? (
                    <div style={stateBoxStyle}>{hotDealsError}</div>
                ) : onSaleHotDeals.length === 0 ? (
                    <div style={stateBoxStyle}>현재 진행 중인 핫딜이 없습니다.</div>
                ) : (
                    <>
                        <section
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                                gap: '18px',
                            }}
                        >
                            {visibleHotDeals.map((item) => {
                                const hotDealName = getHotDealName(item)

                                return (
                                    <Link
                                        key={item.hotDealId}
                                        to={`/hotdeals/${item.hotDealId}`}
                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                    >
                                        <article style={compactHotDealCardStyle}>
                                            <div style={compactHotDealImageStyle}>
                                                <span style={cardBadgeStyle}>
                                                    {getHotDealBadge(item.status)}
                                                </span>
                                                <span style={{ fontSize: '48px' }}>
                                                    {getHotDealEmoji(hotDealName)}
                                                </span>
                                            </div>

                                            <div style={{ padding: '18px 18px 22px' }}>
                                                <h3
                                                    style={{
                                                        margin: '0 0 10px',
                                                        fontSize: '19px',
                                                        fontWeight: 800,
                                                        lineHeight: 1.5,
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    {hotDealName}
                                                </h3>

                                                <p
                                                    style={{
                                                        margin: '0 0 8px',
                                                        color: '#9ca3af',
                                                        textDecoration: 'line-through',
                                                        fontSize: '13px',
                                                        fontWeight: 700,
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    {formatPrice(item.originalPrice)}
                                                </p>

                                                <div
                                                    style={{
                                                        position: 'relative',
                                                        minHeight: '34px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            position: 'absolute',
                                                            left: 0,
                                                            color: '#dc2626',
                                                            fontSize: '18px',
                                                            fontWeight: 900,
                                                        }}
                                                    >
                                                        -{item.discountRate}%
                                                    </span>

                                                    <span
                                                        style={{
                                                            fontSize: '24px',
                                                            fontWeight: 900,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {formatPrice(item.hotDealPrice)}
                                                    </span>
                                                </div>
                                            </div>
                                        </article>
                                    </Link>
                                )
                            })}
                        </section>

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                gap: '10px',
                                marginTop: '14px',
                                marginBottom: '40px',
                            }}
                        >
                            <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: 700 }}>
                                {hotDealPage + 1}/{hotDealPageCount}
                            </span>

                            <button
                                type="button"
                                onClick={() => setHotDealPage((prev) => Math.max(prev - 1, 0))}
                                disabled={hotDealPage === 0}
                                style={{
                                    ...arrowButtonStyle,
                                    opacity: hotDealPage === 0 ? 0.45 : 1,
                                    cursor: hotDealPage === 0 ? 'not-allowed' : 'pointer',
                                }}
                            >
                                ‹
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setHotDealPage((prev) =>
                                        Math.min(prev + 1, hotDealPageCount - 1),
                                    )
                                }
                                disabled={hotDealPage === hotDealPageCount - 1}
                                style={{
                                    ...arrowButtonStyle,
                                    opacity: hotDealPage === hotDealPageCount - 1 ? 0.45 : 1,
                                    cursor:
                                        hotDealPage === hotDealPageCount - 1
                                            ? 'not-allowed'
                                            : 'pointer',
                                }}
                            >
                                ›
                            </button>
                        </div>
                    </>
                )}

                {!hotDealsLoading && !hotDealsError && (
                    <>
                        <SectionTitle title="오픈 예정 핫딜" />

                        {readyHotDeals.length === 0 ? (
                            <div style={stateBoxStyle}>현재 오픈 예정 핫딜이 없습니다.</div>
                        ) : (
                            <>
                                <section
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                                        gap: '18px',
                                    }}
                                >
                                    {visibleReadyHotDeals.map((item) => {
                                        const hotDealName = getHotDealName(item)

                                        return (
                                            <Link
                                                key={`ready-${item.hotDealId}`}
                                                to={`/hotdeals/${item.hotDealId}`}
                                                style={{ textDecoration: 'none', color: 'inherit' }}
                                            >
                                                <article style={readyHotDealCardStyle}>
                                                    <div style={readyHotDealImageStyle}>
                                                        <span style={readyBadgeStyle}>오픈예정</span>
                                                        <span style={{ fontSize: '44px' }}>
                                                            {getHotDealEmoji(hotDealName)}
                                                        </span>
                                                    </div>

                                                    <div style={{ padding: '18px 18px 20px' }}>
                                                        <h3
                                                            style={{
                                                                margin: '0 0 10px',
                                                                fontSize: '18px',
                                                                fontWeight: 800,
                                                                lineHeight: 1.45,
                                                                textAlign: 'center',
                                                            }}
                                                        >
                                                            {hotDealName}
                                                        </h3>

                                                        <p
                                                            style={{
                                                                margin: '0 0 8px',
                                                                color: '#111827',
                                                                fontSize: '16px',
                                                                fontWeight: 800,
                                                                textAlign: 'center',
                                                            }}
                                                        >
                                                            예정가 {formatPrice(item.hotDealPrice)}
                                                        </p>

                                                        <p
                                                            style={{
                                                                margin: 0,
                                                                color: '#6b7280',
                                                                fontSize: '13px',
                                                                textAlign: 'center',
                                                                lineHeight: 1.5,
                                                            }}
                                                        >
                                                            {formatOpenDateTime(item.startTime)}
                                                        </p>
                                                    </div>
                                                </article>
                                            </Link>
                                        )
                                    })}
                                </section>

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        alignItems: 'center',
                                        gap: '10px',
                                        marginTop: '14px',
                                        marginBottom: '40px',
                                    }}
                                >
                                    <span
                                        style={{
                                            color: '#6b7280',
                                            fontSize: '14px',
                                            fontWeight: 700,
                                        }}
                                    >
                                        {readyHotDealPage + 1}/{readyHotDealPageCount}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setReadyHotDealPage((prev) => Math.max(prev - 1, 0))
                                        }
                                        disabled={readyHotDealPage === 0}
                                        style={{
                                            ...arrowButtonStyle,
                                            opacity: readyHotDealPage === 0 ? 0.45 : 1,
                                            cursor:
                                                readyHotDealPage === 0
                                                    ? 'not-allowed'
                                                    : 'pointer',
                                        }}
                                    >
                                        ‹
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setReadyHotDealPage((prev) =>
                                                Math.min(prev + 1, readyHotDealPageCount - 1),
                                            )
                                        }
                                        disabled={readyHotDealPage === readyHotDealPageCount - 1}
                                        style={{
                                            ...arrowButtonStyle,
                                            opacity:
                                                readyHotDealPage === readyHotDealPageCount - 1
                                                    ? 0.45
                                                    : 1,
                                            cursor:
                                                readyHotDealPage === readyHotDealPageCount - 1
                                                    ? 'not-allowed'
                                                    : 'pointer',
                                        }}
                                    >
                                        ›
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '14px',
                        flexWrap: 'wrap',
                    }}
                >
                    <SectionTitle title="일반 상품" noMargin />

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={() => setSelectedProductSort('LATEST')}
                            style={{
                                ...sortButtonStyle,
                                ...(selectedProductSort === 'LATEST'
                                    ? activeSortButtonStyle
                                    : inactiveSortButtonStyle),
                            }}
                        >
                            최신순
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedProductSort('BEST')}
                            style={{
                                ...sortButtonStyle,
                                ...(selectedProductSort === 'BEST'
                                    ? activeSortButtonStyle
                                    : inactiveSortButtonStyle),
                            }}
                        >
                            구매순
                        </button>
                    </div>
                </div>

                <section
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        border: '1px solid #ececec',
                        borderRadius: '18px',
                        backgroundColor: '#ffffff',
                        marginBottom: '24px',
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {productCategories.map((category) => {
                            const active = category === selectedProductCategory

                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setSelectedProductCategory(category)}
                                    style={{
                                        border: active ? '1px solid #111827' : '1px solid #e5e7eb',
                                        backgroundColor: active ? '#111827' : '#ffffff',
                                        color: active ? '#ffffff' : '#111827',
                                        padding: '14px 24px',
                                        borderRadius: '14px',
                                        fontWeight: 700,
                                        fontSize: '15px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {category}
                                </button>
                            )
                        })}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '360px',
                            maxWidth: '100%',
                        }}
                    >
                        <input
                            type="text"
                            value={productSearchInput}
                            onChange={(e) => setProductSearchInput(e.target.value)}
                            onKeyDown={handleProductSearchKeyDown}
                            placeholder="상품 이름 검색"
                            style={{
                                flex: 1,
                                height: '48px',
                                border: '1px solid #d1d5db',
                                borderRadius: '14px',
                                padding: '0 16px',
                                fontSize: '14px',
                                outline: 'none',
                            }}
                        />

                        <button
                            type="button"
                            onClick={handleApplyProductSearch}
                            style={{
                                height: '48px',
                                border: '1px solid #111827',
                                backgroundColor: '#111827',
                                color: '#ffffff',
                                borderRadius: '14px',
                                padding: '0 18px',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                flexShrink: 0,
                            }}
                        >
                            검색
                        </button>
                    </div>
                </section>

                {productsLoading ? (
                    <div style={stateBoxStyle}>일반 상품을 불러오는 중입니다...</div>
                ) : productsError ? (
                    <div style={stateBoxStyle}>{productsError}</div>
                ) : filteredProducts.length === 0 ? (
                    <div style={stateBoxStyle}>등록된 일반 상품이 없습니다.</div>
                ) : (
                    <section
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                            gap: '22px',
                            marginBottom: '56px',
                        }}
                    >
                        {filteredProducts.map((item) => (
                            <Link
                                key={item.id}
                                to={`/products/${item.id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <article style={productCardStyle}>
                                    <div style={productImageStyle}>
                                        {popularProductIds.has(item.id) && (
                                            <span style={productBadgeStyle}>
                                                인기 상품
                                            </span>
                                        )}

                                        <span style={{ fontSize: '64px' }}>
                                            {getProductEmoji(item.name, item.category)}
                                        </span>
                                    </div>

                                    <div style={{ padding: '18px 18px 22px' }}>
                                        <h3
                                            style={{
                                                margin: '0 0 12px',
                                                fontSize: '19px',
                                                fontWeight: 800,
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {item.name}
                                        </h3>

                                        <p
                                            style={{
                                                margin: '0 0 8px',
                                                color: '#1d4ed8',
                                                fontSize: '16px',
                                                fontWeight: 800,
                                            }}
                                        >
                                            판매가 {formatPrice(item.price)}
                                        </p>

                                        <p
                                            style={{
                                                margin: 0,
                                                color: '#ef4444',
                                                fontSize: '14px',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {getProductSubText(item.status, item.category)}
                                        </p>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </section>
                )}
            </main>
        </div>
    )
}

function SectionTitle({
                          title,
                          noMargin = false,
                      }: {
    title: string
    noMargin?: boolean
}) {
    return (
        <div style={{ marginBottom: noMargin ? 0 : '18px' }}>
            <h2
                style={{
                    margin: 0,
                    fontSize: '30px',
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                }}
            >
                {title}
            </h2>
        </div>
    )
}

function PlaceholderPage({ title }: { title: string }) {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
            <SiteHeader />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900 }}>{title}</h1>
                <p style={{ marginTop: '12px', color: '#6b7280' }}>추후 구현 예정입니다.</p>
            </div>
        </div>
    )
}

const compactHotDealCardStyle = {
    border: '1px solid #ececec',
    borderRadius: '24px',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(17, 24, 39, 0.05)',
} as const

const compactHotDealImageStyle = {
    position: 'relative',
    height: '220px',
    background: 'linear-gradient(135deg, #f9fafb 0%, #fff8dc 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
} as const

const readyHotDealCardStyle = {
    border: '1px solid #ececec',
    borderRadius: '24px',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(17, 24, 39, 0.04)',
} as const

const readyHotDealImageStyle = {
    position: 'relative',
    height: '200px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #fff8dc 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
} as const

const cardBadgeStyle = {
    position: 'absolute',
    top: '14px',
    left: '14px',
    borderRadius: '999px',
    backgroundColor: '#fff1f2',
    color: '#ef4444',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 800,
    border: '1px solid #fecdd3',
} as const

const readyBadgeStyle = {
    position: 'absolute',
    top: '14px',
    left: '14px',
    borderRadius: '999px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 800,
    border: '1px solid #bfdbfe',
} as const

const productCardStyle = {
    border: '1px solid #ececec',
    borderRadius: '24px',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(17, 24, 39, 0.05)',
} as const

const productImageStyle = {
    position: 'relative',
    height: '240px',
    background: 'linear-gradient(135deg, #f9fafb 0%, #fff8dc 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
} as const

const productBadgeStyle = {
    position: 'absolute',
    top: '16px',
    left: '16px',
    borderRadius: '999px',
    backgroundColor: '#fff6cc',
    color: '#9a6b00',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 800,
    border: '1px solid #f1c84b',
} as const

const arrowButtonStyle = {
    width: '40px',
    height: '40px',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '24px',
    lineHeight: 1,
} as const

const sortButtonStyle = {
    height: '42px',
    borderRadius: '12px',
    padding: '0 16px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
} as const

const activeSortButtonStyle = {
    border: '1px solid #111827',
    backgroundColor: '#111827',
    color: '#ffffff',
} as const

const inactiveSortButtonStyle = {
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    color: '#111827',
} as const

const stateBoxStyle = {
    border: '1px solid #ececec',
    borderRadius: '20px',
    padding: '48px 24px',
    marginBottom: '52px',
    textAlign: 'center',
    color: '#6b7280',
    backgroundColor: '#ffffff',
} as const

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/notices" element={<NoticeListPage />} />
            <Route path="/notices/:id" element={<NoticeDetailPage />} />
            <Route path="/hotdeals/:id" element={<HotDealDetailPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/orders" element={<PlaceholderPage title="주문 목록" />} />
            <Route path="/cart-items" element={<CartPage />} />
            <Route path="/order-sheet" element={<OrderSheetPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/mypage/orders" element={<OrderListPage />} />
            <Route path="/mypage/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/mypage/inquiries" element={<MyInquiryPage />} />
            <Route path="/mypage/reviews" element={<MyReviewPage />} />
            <Route path="/mypage/reviews/write" element={<ReviewCreatePage />} />
            <Route path="/mypage/password-check" element={<MyPagePasswordCheck />} />
            <Route path="/mypage/edit-myinfo" element={<MyPageEditMyInfo />} />
        </Routes>
    )
}