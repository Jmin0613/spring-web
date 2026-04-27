import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import './WishlistPage.css'

const API_BASE_URL = 'http://localhost:8080'
const PAGE_SIZE = 10

type WishlistItem = {
    productId: number
    productName: string
    price: number
    imageUrl?: string | null
    wishCount?: number
    createdAt?: string
}

function formatPrice(price?: number | null) {
    return `${(price ?? 0).toLocaleString('ko-KR')}원`
}

function getProductEmoji(name?: string) {
    if (!name) return '🎁'
    return '🎁'
}

function getWishlistErrorMessage(error: unknown, fallback = '찜한 상품을 불러오지 못했습니다.') {
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

export default function WishlistPage() {
    const [items, setItems] = useState<WishlistItem[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
    const [actionLoadingMap, setActionLoadingMap] = useState<Record<number, boolean>>({})
    const [bulkActionLoading, setBulkActionLoading] = useState(false)

    async function loadWishlist() {
        try {
            setLoading(true)
            setErrorMessage('')

            const response = await axios.get<WishlistItem[]>(`${API_BASE_URL}/wishlist`, {
                withCredentials: true,
            })

            setItems(response.data)
        } catch (error) {
            setErrorMessage(getWishlistErrorMessage(error))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadWishlist()
    }, [])

    const totalCount = items.length

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(items.length / PAGE_SIZE))
    }, [items.length])

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

    const currentPageItems = useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE
        return items.slice(startIndex, startIndex + PAGE_SIZE)
    }, [items, currentPage])

    const currentPageIds = useMemo(() => {
        return currentPageItems.map((item) => item.productId)
    }, [currentPageItems])

    const selectedCountOnCurrentPage = useMemo(() => {
        return currentPageIds.filter((id) => selectedProductIds.includes(id)).length
    }, [currentPageIds, selectedProductIds])

    const allCurrentPageSelected =
        currentPageIds.length > 0 &&
        currentPageIds.every((id) => selectedProductIds.includes(id))

    function handleToggleOne(productId: number) {
        setSelectedProductIds((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId],
        )
    }

    function handleToggleCurrentPageAll() {
        if (currentPageIds.length === 0) return

        setSelectedProductIds((prev) => {
            if (allCurrentPageSelected) {
                return prev.filter((id) => !currentPageIds.includes(id))
            }

            const merged = new Set([...prev, ...currentPageIds])
            return Array.from(merged)
        })
    }

    async function handleDeleteOne(productId: number) {
        const confirmed = window.confirm('찜한 상품 목록에서 삭제할까요?')
        if (!confirmed) return

        try {
            setActionLoadingMap((prev) => ({
                ...prev,
                [productId]: true,
            }))

            await axios.post(
                `${API_BASE_URL}/products/${productId}/wishlist`,
                {},
                { withCredentials: true },
            )

            setSelectedProductIds((prev) => prev.filter((id) => id !== productId))
            await loadWishlist()
        } catch (error) {
            alert(getWishlistErrorMessage(error, '찜한 상품 삭제에 실패했습니다.'))
        } finally {
            setActionLoadingMap((prev) => ({
                ...prev,
                [productId]: false,
            }))
        }
    }

    async function handleDeleteSelected() {
        const targetIds = currentPageIds.filter((id) => selectedProductIds.includes(id))

        if (targetIds.length === 0) {
            alert('삭제할 상품을 선택해주세요.')
            return
        }

        const confirmed = window.confirm('선택한 찜한 상품을 삭제할까요?')
        if (!confirmed) return

        try {
            setBulkActionLoading(true)

            await Promise.all(
                targetIds.map((productId) =>
                    axios.post(
                        `${API_BASE_URL}/products/${productId}/wishlist`,
                        {},
                        { withCredentials: true },
                    ),
                ),
            )

            setSelectedProductIds((prev) => prev.filter((id) => !targetIds.includes(id)))
            await loadWishlist()
        } catch (error) {
            alert(getWishlistErrorMessage(error, '선택 삭제에 실패했습니다.'))
        } finally {
            setBulkActionLoading(false)
        }
    }

    async function handleAddToCart(productId: number) {
        try {
            setActionLoadingMap((prev) => ({
                ...prev,
                [productId]: true,
            }))

            await axios.post(
                `${API_BASE_URL}/products/${productId}/cart-items`,
                { quantity: 1 },
                { withCredentials: true },
            )

            alert('장바구니에 담았습니다.')
        } catch (error) {
            alert(getWishlistErrorMessage(error, '장바구니 담기에 실패했습니다.'))
        } finally {
            setActionLoadingMap((prev) => ({
                ...prev,
                [productId]: false,
            }))
        }
    }

    return (
        <div className="wishlist-page">
            <SiteHeader />

            <main className="wishlist-page__content">
                <section className="wishlist-page__header">
                    <div className="wishlist-page__header-left">
                        <h1 className="wishlist-page__title">찜한 상품</h1>
                        <span className="wishlist-page__title-count">총 {totalCount}개</span>
                    </div>

                    <div className="wishlist-page__header-right">
                        <button
                            type="button"
                            className="wishlist-page__select-all-button"
                            onClick={handleToggleCurrentPageAll}
                            disabled={bulkActionLoading || currentPageIds.length === 0}
                        >
                            {allCurrentPageSelected ? '전체 해제' : '전체 선택'}
                        </button>

                        <button
                            type="button"
                            className="wishlist-page__delete-selected-button"
                            onClick={handleDeleteSelected}
                            disabled={bulkActionLoading || selectedCountOnCurrentPage === 0}
                        >
                            전체삭제
                        </button>

                        <span className="wishlist-page__selection-count">
                            선택 {selectedCountOnCurrentPage} / 전체 {currentPageIds.length}
                        </span>
                    </div>
                </section>

                {loading ? (
                    <div className="wishlist-page__state-box">찜한 상품을 불러오는 중입니다...</div>
                ) : errorMessage ? (
                    <div className="wishlist-page__state-box">{errorMessage}</div>
                ) : items.length === 0 ? (
                    <div className="wishlist-page__empty-box">
                        <div className="wishlist-page__empty-emoji">🤍</div>
                        <p className="wishlist-page__empty-title">찜한 상품이 없습니다.</p>
                        <p className="wishlist-page__empty-description">
                            상품 상세에서 찜하기를 누르면 이곳에 모입니다.
                        </p>
                    </div>
                ) : (
                    <>
                        <ul className="wishlist-list">
                            {currentPageItems.map((item) => {
                                const actionLoading =
                                    !!actionLoadingMap[item.productId] || bulkActionLoading

                                return (
                                    <li key={item.productId} className="wishlist-card">
                                        <div className="wishlist-card__check-column">
                                            <label className="wishlist-card__checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProductIds.includes(item.productId)}
                                                    onChange={() => handleToggleOne(item.productId)}
                                                    disabled={actionLoading}
                                                />
                                                <span className="wishlist-card__checkbox-custom" />
                                            </label>
                                        </div>

                                        <Link
                                            to={`/products/${item.productId}`}
                                            className="wishlist-card__main-link"
                                        >
                                            <div className="wishlist-card__image-box">
                                                <span className="wishlist-card__emoji">
                                                    {getProductEmoji(item.productName)}
                                                </span>
                                            </div>

                                            <div className="wishlist-card__body">
                                                <h2 className="wishlist-card__product-name">
                                                    {item.productName}
                                                </h2>

                                                <div className="wishlist-card__meta">
                                                    <span>찜한 상품</span>
                                                    {typeof item.wishCount === 'number' && (
                                                        <span>❤️ {item.wishCount}</span>
                                                    )}
                                                </div>

                                                <div className="wishlist-card__price">
                                                    {formatPrice(item.price)}
                                                </div>
                                            </div>
                                        </Link>

                                        <div className="wishlist-card__actions">
                                            <button
                                                type="button"
                                                className="wishlist-card__cart-button"
                                                onClick={() => handleAddToCart(item.productId)}
                                                disabled={actionLoading}
                                            >
                                                장바구니 담기
                                            </button>

                                            <button
                                                type="button"
                                                className="wishlist-card__delete-button"
                                                onClick={() => handleDeleteOne(item.productId)}
                                                disabled={actionLoading}
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>

                        {totalPages > 1 && (
                            <div className="wishlist-page__pagination">
                                <button
                                    type="button"
                                    className="wishlist-page__page-button"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    ‹
                                </button>

                                <span className="wishlist-page__page-indicator">
                                    {currentPage} / {totalPages}
                                </span>

                                <button
                                    type="button"
                                    className="wishlist-page__page-button"
                                    onClick={() =>
                                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                                    }
                                    disabled={currentPage === totalPages}
                                >
                                    ›
                                </button>
                            </div>
                        )}

                        <p className="wishlist-page__page-note">한 페이지당 10개의 찜한 상품</p>
                    </>
                )}
            </main>
        </div>
    )
}