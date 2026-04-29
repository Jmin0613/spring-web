import { type KeyboardEvent, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import SiteHeader from '../../components/SiteHeader.tsx'
import './HomePage.css'

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

    if (selectedCategory === '뷰티·패션') {
        return product.category === '뷰티' || product.category === '패션'
    }

    return product.category === selectedCategory
}

function HomeImage({
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
        return <span className="home-image-placeholder">이미지 없음</span>
    }

    return (
        <img
            className="home-card-image-img"
            src={imageUrl}
            alt={alt}
            onError={() => setImageError(true)}
        />
    )
}

export default function HomePage() {
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
    const readyHotDealPageCount = Math.max(
        1,
        Math.ceil(readyHotDeals.length / readyHotDealsPerPage),
    )
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
        <div className="home-page">
            <SiteHeader />

            <main className="home-container">
                <section className="home-hero">
                    <div>
                        <p className="home-hero-eyebrow">TODAY DEAL</p>
                        <h1 className="home-hero-title">오늘의 추천 딜</h1>
                    </div>
                </section>

                <SectionTitle title="진행 중인 핫딜" />

                {hotDealsLoading ? (
                    <div className="home-state-box">핫딜 상품을 불러오는 중입니다...</div>
                ) : hotDealsError ? (
                    <div className="home-state-box">{hotDealsError}</div>
                ) : onSaleHotDeals.length === 0 ? (
                    <div className="home-state-box">현재 진행 중인 핫딜이 없습니다.</div>
                ) : (
                    <>
                        <section className="home-hotdeal-grid">
                            {visibleHotDeals.map((item) => {
                                const hotDealName = getHotDealName(item)

                                return (
                                    <Link
                                        key={item.hotDealId}
                                        to={`/hotdeals/${item.hotDealId}`}
                                        className="home-card-link"
                                    >
                                        <article className="home-hotdeal-card">
                                            <div className="home-hotdeal-image">
                                                <span className="home-hotdeal-badge">
                                                    {getHotDealBadge(item.status)}
                                                </span>

                                                <HomeImage
                                                    imageUrl={item.imageUrl}
                                                    alt={hotDealName}
                                                />
                                            </div>

                                            <div className="home-hotdeal-body">
                                                <h3 className="home-hotdeal-name">
                                                    {hotDealName}
                                                </h3>

                                                <p className="home-hotdeal-original-price">
                                                    {formatPrice(item.originalPrice)}
                                                </p>

                                                <div className="home-hotdeal-price-row">
                                                    <span className="home-hotdeal-discount">
                                                        -{item.discountRate}%
                                                    </span>

                                                    <span className="home-hotdeal-price">
                                                        {formatPrice(item.hotDealPrice)}
                                                    </span>
                                                </div>
                                            </div>
                                        </article>
                                    </Link>
                                )
                            })}
                        </section>

                        <SliderControls
                            currentPage={hotDealPage}
                            pageCount={hotDealPageCount}
                            onPrev={() => setHotDealPage((prev) => Math.max(prev - 1, 0))}
                            onNext={() =>
                                setHotDealPage((prev) =>
                                    Math.min(prev + 1, hotDealPageCount - 1),
                                )
                            }
                        />
                    </>
                )}

                {!hotDealsLoading && !hotDealsError && (
                    <>
                        <SectionTitle title="오픈 예정 핫딜" />

                        {readyHotDeals.length === 0 ? (
                            <div className="home-state-box">현재 오픈 예정 핫딜이 없습니다.</div>
                        ) : (
                            <>
                                <section className="home-ready-hotdeal-grid">
                                    {visibleReadyHotDeals.map((item) => {
                                        const hotDealName = getHotDealName(item)

                                        return (
                                            <Link
                                                key={`ready-${item.hotDealId}`}
                                                to={`/hotdeals/${item.hotDealId}`}
                                                className="home-card-link"
                                            >
                                                <article className="home-ready-hotdeal-card">
                                                    <div className="home-ready-hotdeal-image">
                                                        <span className="home-ready-badge">
                                                            오픈예정
                                                        </span>

                                                        <HomeImage
                                                            imageUrl={item.imageUrl}
                                                            alt={hotDealName}
                                                        />
                                                    </div>

                                                    <div className="home-ready-hotdeal-body">
                                                        <h3 className="home-ready-hotdeal-name">
                                                            {hotDealName}
                                                        </h3>

                                                        <p className="home-ready-hotdeal-price">
                                                            예정가 {formatPrice(item.hotDealPrice)}
                                                        </p>

                                                        <p className="home-ready-hotdeal-date">
                                                            {formatOpenDateTime(item.startTime)}
                                                        </p>
                                                    </div>
                                                </article>
                                            </Link>
                                        )
                                    })}
                                </section>

                                <SliderControls
                                    currentPage={readyHotDealPage}
                                    pageCount={readyHotDealPageCount}
                                    onPrev={() =>
                                        setReadyHotDealPage((prev) => Math.max(prev - 1, 0))
                                    }
                                    onNext={() =>
                                        setReadyHotDealPage((prev) =>
                                            Math.min(prev + 1, readyHotDealPageCount - 1),
                                        )
                                    }
                                />
                            </>
                        )}
                    </>
                )}

                <div className="home-product-title-row">
                    <SectionTitle title="일반 상품" noMargin />

                    <div className="home-product-sort-row">
                        <button
                            type="button"
                            onClick={() => setSelectedProductSort('LATEST')}
                            className={
                                selectedProductSort === 'LATEST'
                                    ? 'home-sort-button home-sort-button--active'
                                    : 'home-sort-button'
                            }
                        >
                            최신순
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedProductSort('BEST')}
                            className={
                                selectedProductSort === 'BEST'
                                    ? 'home-sort-button home-sort-button--active'
                                    : 'home-sort-button'
                            }
                        >
                            구매순
                        </button>
                    </div>
                </div>

                <section className="home-product-toolbar">
                    <div className="home-category-row">
                        {productCategories.map((category) => {
                            const active = category === selectedProductCategory

                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setSelectedProductCategory(category)}
                                    className={
                                        active
                                            ? 'home-category-button home-category-button--active'
                                            : 'home-category-button'
                                    }
                                >
                                    {category}
                                </button>
                            )
                        })}
                    </div>

                    <div className="home-product-search-box">
                        <input
                            type="text"
                            value={productSearchInput}
                            onChange={(e) => setProductSearchInput(e.target.value)}
                            onKeyDown={handleProductSearchKeyDown}
                            placeholder="상품 이름 검색"
                            className="home-product-search-input"
                        />

                        <button
                            type="button"
                            onClick={handleApplyProductSearch}
                            className="home-product-search-button"
                        >
                            검색
                        </button>
                    </div>
                </section>

                {productsLoading ? (
                    <div className="home-state-box">일반 상품을 불러오는 중입니다...</div>
                ) : productsError ? (
                    <div className="home-state-box">{productsError}</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="home-state-box">등록된 일반 상품이 없습니다.</div>
                ) : (
                    <section className="home-product-grid">
                        {filteredProducts.map((item) => (
                            <Link
                                key={item.id}
                                to={`/products/${item.id}`}
                                className="home-card-link"
                            >
                                <article className="home-product-card">
                                    <div className="home-product-image">
                                        {popularProductIds.has(item.id) && (
                                            <span className="home-product-popular-badge">
                                                인기 상품
                                            </span>
                                        )}

                                        {item.status === 'SOLD_OUT' && (
                                            <span className="home-product-sold-out-badge">
                                                품절
                                            </span>
                                        )}

                                        <HomeImage imageUrl={item.imageUrl} alt={item.name} />
                                    </div>

                                    <div className="home-product-body">
                                        <h3 className="home-product-name">{item.name}</h3>

                                        <p className="home-product-price">
                                            판매가 {formatPrice(item.price)}
                                        </p>

                                        <p
                                            className={
                                                item.status === 'SOLD_OUT'
                                                    ? 'home-product-sub-text home-product-sub-text--sold-out'
                                                    : 'home-product-sub-text'
                                            }
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
        <div
            className={
                noMargin
                    ? 'home-section-title home-section-title--no-margin'
                    : 'home-section-title'
            }
        >
            <h2>{title}</h2>
        </div>
    )
}

function SliderControls({
                            currentPage,
                            pageCount,
                            onPrev,
                            onNext,
                        }: {
    currentPage: number
    pageCount: number
    onPrev: () => void
    onNext: () => void
}) {
    const isFirstPage = currentPage === 0
    const isLastPage = currentPage === pageCount - 1

    return (
        <div className="home-slider-controls">
            <span className="home-slider-page-text">
                {currentPage + 1}/{pageCount}
            </span>

            <button
                type="button"
                onClick={onPrev}
                disabled={isFirstPage}
                className="home-arrow-button"
            >
                ‹
            </button>

            <button
                type="button"
                onClick={onNext}
                disabled={isLastPage}
                className="home-arrow-button"
            >
                ›
            </button>
        </div>
    )
}