import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, Route, Routes } from 'react-router-dom'
import NoticeListPage from './pages/NoticeListPage'
import NoticeDetailPage from './pages/NoticeDetailPage'
import HotDealDetailPage from './pages/HotDealDetailPage'
import ProductDetailPage from './pages/ProductDetailPage'
import LoginPage from './pages/LoginPage'
import SiteHeader from './components/SiteHeader'
import SignupPage from './pages/SignupPage'

// 최상위 루트 컴포넌트
/*
App.tsx에서 하는 일
    1. 라우팅 설정
    2. 공통 레이아웃 연결
    3. 페이지 분기
main.tsx가 앱을 시작시키는 파일이라면, App.tsx는 시작된 앱의 제일 큰 화면 뼈대
 */

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
}

const API_BASE_URL = 'http://localhost:8080'

const categories = ['전체', '식품', '생활', '가전', '뷰티·패션', '여행·쿠폰']

function formatPrice(price: number) {
    return `${price.toLocaleString('ko-KR')}원`
}

function getHotDealName(item: HotDealApiItem) {
    return item.productName ?? item.productName ?? '이름 없는 핫딜'
}

function getHotDealBadge(status: string) {
    if (status === 'ON_SALE') {
        return '진행중'
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

    if (name.includes('강아지')) {
        return '🐶'
    }

    if (name.includes('고양이')) {
        return '🐱'
    }

    if (name.includes('비타민')) {
        return '💊'
    }

    if (name.includes('노트북')) {
        return '💻'
    }

    return '🎁'
}

function getProductBadge(category: string) {
    if (category === 'Doll') {
        return '추천 상품'
    }

    if (category === 'Food') {
        return 'BEST'
    }

    if (category === 'Beauty') {
        return '신상'
    }

    return '인기 상품'
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

function HomePage() {

    const [hotDeals, setHotDeals] = useState<HotDealApiItem[]>([])
    const [hotDealsLoading, setHotDealsLoading] = useState(true)
    const [hotDealsError, setHotDealsError] = useState('')

    const [products, setProducts] = useState<ProductApiItem[]>([])
    const [productsLoading, setProductsLoading] = useState(true)
    const [productsError, setProductsError] = useState('')

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

        loadHotDeals()
    }, [])

    useEffect(() => {
        async function loadProducts() {
            try {
                const response = await axios.get<ProductApiItem[]>(`${API_BASE_URL}/products`)
                setProducts(response.data)
            } catch (error) {
                setProductsError('일반 상품을 불러오지 못했습니다.')
            } finally {
                setProductsLoading(false)
            }
        }

        loadProducts()
    }, [])

    return (
        <div
            style={{
                backgroundColor: '#ffffff',
                minHeight: '100vh',
                color: '#111827',
            }}
        >
            <SiteHeader />

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 24px 96px' }}>
                <section
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'end',
                        gap: '16px',
                        marginBottom: '20px',
                    }}
                >
                    <div>
                        <p
                            style={{
                                margin: 0,
                                color: '#d19a00',
                                fontSize: '14px',
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                            }}
                        >
                            TODAY DEAL
                        </p>
                        <h1
                            style={{
                                margin: '10px 0 0',
                                fontSize: '42px',
                                fontWeight: 900,
                                lineHeight: 1.2,
                                letterSpacing: '-0.04em',
                            }}
                        >
                            오늘의 추천 딜
                        </h1>
                    </div>
                </section>

                <section
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        padding: '16px',
                        border: '1px solid #ececec',
                        borderRadius: '18px',
                        backgroundColor: '#ffffff',
                        marginBottom: '28px',
                    }}
                >
                    {categories.map((category, index) => (
                        <button
                            key={category}
                            type="button"
                            style={{
                                border: index === 0 ? '1px solid #111827' : '1px solid #e5e7eb',
                                backgroundColor: index === 0 ? '#111827' : '#ffffff',
                                color: index === 0 ? '#ffffff' : '#111827',
                                padding: '14px 24px',
                                borderRadius: '14px',
                                fontWeight: 700,
                                fontSize: '15px',
                                cursor: 'pointer',
                            }}
                        >
                            {category}
                        </button>
                    ))}
                </section>

                <HomeSectionTitle
                    title="진행 중인 핫딜 상품들"
                    description="짧은 시간 동안만 만날 수 있는 인기 특가 상품입니다."
                />

                {hotDealsLoading ? (
                    <div style={stateBoxStyle}>핫딜 상품을 불러오는 중입니다...</div>
                ) : hotDealsError ? (
                    <div style={stateBoxStyle}>{hotDealsError}</div>
                ) : hotDeals.length === 0 ? (
                    <div style={stateBoxStyle}>현재 진행 중인 핫딜이 없습니다.</div>
                ) : (
                    <section
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '18px',
                            marginBottom: '52px',
                        }}
                    >
                        {hotDeals.map((item) => {
                            const hotDealName = getHotDealName(item)

                            return (
                                <Link
                                    key={item.hotDealId}
                                    to={`/hotdeals/${item.hotDealId}`}
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <article style={hotDealCardStyle}>
                                        <div style={cardImageStyle}>
                                            <span style={cardBadgeStyle}>{getHotDealBadge(item.status)}</span>
                                            <span style={{ fontSize: '56px' }}>{getHotDealEmoji(hotDealName)}</span>
                                        </div>

                                        <div style={{ padding: '18px 18px 20px' }}>
                                            <h3
                                                style={{
                                                    margin: '0 0 12px',
                                                    fontSize: '17px',
                                                    fontWeight: 700,
                                                    lineHeight: 1.5,
                                                    minHeight: '52px',
                                                }}
                                            >
                                                {hotDealName}
                                            </h3>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: '#dc2626', fontSize: '18px', fontWeight: 900 }}>
                                                    {item.discountRate}%
                                                </span>
                                                <span style={{ fontSize: '24px', fontWeight: 900 }}>
                                                    {formatPrice(item.hotDealPrice)}
                                                </span>
                                            </div>

                                            <p
                                                style={{
                                                    margin: '6px 0 0',
                                                    color: '#9ca3af',
                                                    textDecoration: 'line-through',
                                                    fontSize: '14px',
                                                }}
                                            >
                                                {formatPrice(item.originalPrice)}
                                            </p>
                                        </div>
                                    </article>
                                </Link>
                            )
                        })}
                    </section>
                )}

                <HomeSectionTitle
                    title="일반상품들"
                    description="핫딜 아래에서 일반 상품도 함께 둘러볼 수 있게 배치했습니다."
                />

                {productsLoading ? (
                    <div style={stateBoxStyle}>일반 상품을 불러오는 중입니다...</div>
                ) : productsError ? (
                    <div style={stateBoxStyle}>{productsError}</div>
                ) : products.length === 0 ? (
                    <div style={stateBoxStyle}>등록된 일반 상품이 없습니다.</div>
                ) : (
                    <section
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '22px',
                        }}
                    >
                        {products.map((item) => (
                            <Link
                                key={item.id}
                                to={`/products/${item.id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <article style={productCardStyle}>
                                    <div style={productImageStyle}>
                                        <span style={productBadgeStyle}>{getProductBadge(item.category)}</span>
                                        <span style={{ fontSize: '64px' }}>{getProductEmoji(item.name, item.category)}</span>
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

function HomeSectionTitle({ title, description }: { title: string; description: string }) {
    return (
        <div style={{ marginBottom: '20px' }}>
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
            <p
                style={{
                    margin: '8px 0 0',
                    color: '#6b7280',
                    fontSize: '15px',
                }}
            >
                {description}
            </p>
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

const hotDealCardStyle = {
    border: '1px solid #ececec',
    borderRadius: '22px',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(17, 24, 39, 0.06)',
} as const

const cardImageStyle = {
    position: 'relative',
    height: '180px',
    background: 'linear-gradient(135deg, #fff8dc 0%, #f3f4f6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
} as const

const cardBadgeStyle = {
    position: 'absolute',
    top: '14px',
    left: '14px',
    borderRadius: '999px',
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 800,
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

const stateBoxStyle = {
    border: '1px solid #ececec',
    borderRadius: '20px',
    padding: '48px 24px',
    marginBottom: '52px',
    textAlign: 'center',
    color: '#6b7280',
    backgroundColor: '#ffffff',
} as const

// 라우트
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
            <Route path="/mypage" element={<PlaceholderPage title="마이페이지" />} />
            <Route path="/wishlist" element={<PlaceholderPage title="찜한 상품" />} />
            <Route path="/orders" element={<PlaceholderPage title="주문 목록" />} />
        </Routes>
    )
}
