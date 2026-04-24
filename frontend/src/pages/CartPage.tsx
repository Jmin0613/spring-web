import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import SiteHeader from '../components/SiteHeader'
import './CartPage.css'

const API_BASE_URL = 'http://localhost:8080'

type CartItem = {
    cartItemId: number
    productId: number
    productName: string
    imageUrl?: string | null
    price: number
    quantity: number
    totalPrice: number
    shippingFee: number
    selected: boolean
}

type CartSummary = {
    totalQuantity: number
    totalProductPrice: number
    discountAmount: number
    shippingFee: number
    finalPrice: number
}

type CartResponse = {
    cartItems: CartItem[]
    summary: CartSummary
}

type CouponMode = 'preparing' | 'none'

function formatPrice(price?: number | null) {
    return `${(price ?? 0).toLocaleString('ko-KR')}원`
}

function getCartErrorMessage(error: unknown) {
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

    return '장바구니를 불러오지 못했습니다.'
}

function getProductEmoji(name?: string) {
    if (!name) return '🎁'
    return '🎁'
}

export default function CartPage() {
    const [cart, setCart] = useState<CartResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [actionLoadingMap, setActionLoadingMap] = useState<Record<number, boolean>>({})
    const [bulkSelectionLoading, setBulkSelectionLoading] = useState(false)
    const [couponMode, setCouponMode] = useState<CouponMode>('preparing')

    async function loadCart() {
        try {
            setLoading(true)
            setErrorMessage('')

            const response = await axios.get<CartResponse>(`${API_BASE_URL}/cart-items`, {
                withCredentials: true,
            })

            setCart(response.data)
        } catch (error) {
            setErrorMessage(getCartErrorMessage(error))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadCart()
    }, [])

    const hasItems = useMemo(() => {
        return (cart?.cartItems.length ?? 0) > 0
    }, [cart])

    const totalKindsCount = cart?.cartItems.length ?? 0

    const selectedKindsCount = useMemo(() => {
        return cart?.cartItems.filter((item) => item.selected).length ?? 0
    }, [cart])

    const allSelected = totalKindsCount > 0 && selectedKindsCount === totalKindsCount

    async function handleUpdateQuantity(cartItemId: number, nextQuantity: number) {
        if (nextQuantity < 1) return

        try {
            setActionLoadingMap((prev) => ({
                ...prev,
                [cartItemId]: true,
            }))

            await axios.patch(
                `${API_BASE_URL}/cart-items/${cartItemId}`,
                { quantity: nextQuantity },
                { withCredentials: true },
            )

            await loadCart()
        } catch (error) {
            alert(getCartErrorMessage(error))
        } finally {
            setActionLoadingMap((prev) => ({
                ...prev,
                [cartItemId]: false,
            }))
        }
    }

    async function handleDelete(cartItemId: number) {
        const confirmed = window.confirm('장바구니에서 이 상품을 삭제할까요?')
        if (!confirmed) return

        try {
            setActionLoadingMap((prev) => ({
                ...prev,
                [cartItemId]: true,
            }))

            await axios.delete(`${API_BASE_URL}/cart-items/${cartItemId}`, {
                withCredentials: true,
            })

            await loadCart()
        } catch (error) {
            alert(getCartErrorMessage(error))
        } finally {
            setActionLoadingMap((prev) => ({
                ...prev,
                [cartItemId]: false,
            }))
        }
    }

    async function handleChangeSelection(cartItemId: number, nextSelected: boolean) {
        try {
            setActionLoadingMap((prev) => ({
                ...prev,
                [cartItemId]: true,
            }))

            await axios.patch(
                `${API_BASE_URL}/cart-items/${cartItemId}/selection`,
                { selected: nextSelected },
                { withCredentials: true },
            )

            await loadCart()
        } catch (error) {
            alert(getCartErrorMessage(error))
        } finally {
            setActionLoadingMap((prev) => ({
                ...prev,
                [cartItemId]: false,
            }))
        }
    }

    async function handleToggleAllSelections() {
        if (!cart || cart.cartItems.length === 0) return

        const nextSelected = !allSelected
        const targetItems = cart.cartItems.filter((item) => item.selected !== nextSelected)

        if (targetItems.length === 0) return

        try {
            setBulkSelectionLoading(true)

            await Promise.all(
                targetItems.map((item) =>
                    axios.patch(
                        `${API_BASE_URL}/cart-items/${item.cartItemId}/selection`,
                        { selected: nextSelected },
                        { withCredentials: true },
                    ),
                ),
            )

            await loadCart()
        } catch (error) {
            alert(getCartErrorMessage(error))
        } finally {
            setBulkSelectionLoading(false)
        }
    }

    async function handleDeleteAll() {
        if (!cart || cart.cartItems.length === 0) return

        const confirmed = window.confirm('장바구니 상품을 전체 삭제할까요?')
        if (!confirmed) return

        try {
            setBulkSelectionLoading(true)

            await axios.delete(`${API_BASE_URL}/cart-items`, {
                withCredentials: true,
            })

            await loadCart()
        } catch (error) {
            alert(getCartErrorMessage(error))
        } finally {
            setBulkSelectionLoading(false)
        }
    }

    function handleBuy() {
        if (!cart || cart.summary.totalQuantity === 0) {
            alert('구매할 상품을 선택해주세요.')
            return
        }

        alert('선택된 상품 구매 연결은 다음 주문 단계에서 붙일게요.')
    }

    return (
        <div className="cart-page">
            <SiteHeader />

            <main className="cart-page__content">
                <section className="cart-page__header">
                    <h1 className="cart-page__title">
                        장바구니
                        {cart && (
                            <span className="cart-page__title-count">
                                ({cart.cartItems.length})
                            </span>
                        )}
                    </h1>
                </section>

                {loading ? (
                    <div className="cart-page__state-box">장바구니를 불러오는 중입니다...</div>
                ) : errorMessage ? (
                    <div className="cart-page__state-box">{errorMessage}</div>
                ) : !cart || !hasItems ? (
                    <div className="cart-page__empty-box">
                        <div className="cart-page__empty-emoji">🛒</div>
                        <p className="cart-page__empty-title">장바구니에 담긴 상품이 없습니다.</p>
                        <p className="cart-page__empty-description">
                            상품 상세 페이지에서 장바구니 담기를 눌러보세요.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="cart-layout">
                            <section className="cart-items-panel">
                                <div className="cart-items-panel__header">
                                    <div className="cart-items-panel__header-left">
                                        <h2 className="cart-items-panel__title">상품 목록</h2>
                                    </div>

                                    <div className="cart-items-panel__header-right">
                                        <button
                                            type="button"
                                            className="cart-items-panel__select-all-button"
                                            onClick={handleToggleAllSelections}
                                            disabled={bulkSelectionLoading}
                                        >
                                            {allSelected ? '전체 해제' : '전체 선택'}
                                        </button>

                                        <button
                                            type="button"
                                            className="cart-items-panel__delete-all-button"
                                            onClick={handleDeleteAll}
                                            disabled={bulkSelectionLoading || totalKindsCount === 0}
                                        >
                                            전체삭제
                                        </button>

                                        <span className="cart-items-panel__count-text">
                                            선택 {selectedKindsCount} / 전체 {totalKindsCount}
                                        </span>
                                    </div>
                                </div>

                                <ul className="cart-item-list">
                                    {cart.cartItems.map((item) => {
                                        const actionLoading =
                                            !!actionLoadingMap[item.cartItemId] || bulkSelectionLoading

                                        return (
                                            <li key={item.cartItemId} className="cart-item-card">
                                                <div className="cart-item-card__check-column">
                                                    <label className="cart-item-card__checkbox-label">
                                                        <input
                                                            type="checkbox"
                                                            checked={item.selected}
                                                            onChange={(e) =>
                                                                handleChangeSelection(
                                                                    item.cartItemId,
                                                                    e.target.checked,
                                                                )
                                                            }
                                                            disabled={actionLoading}
                                                        />
                                                        <span className="cart-item-card__checkbox-custom" />
                                                    </label>
                                                </div>

                                                <div className="cart-item-card__image-box">
                                                    <span className="cart-item-card__emoji">
                                                        {getProductEmoji(item.productName)}
                                                    </span>
                                                </div>

                                                <div className="cart-item-card__body">
                                                    <div className="cart-item-card__top">
                                                        <div className="cart-item-card__info">
                                                            <h3 className="cart-item-card__name">
                                                                {item.productName}
                                                            </h3>

                                                            <div className="cart-item-card__meta">
                                                                <span>수량 {item.quantity}개</span>
                                                                <span>개당 {formatPrice(item.price)}</span>
                                                            </div>

                                                            <div className="cart-item-card__price-row">
                                                                <span className="cart-item-card__total-price">
                                                                    {formatPrice(item.totalPrice)}
                                                                </span>
                                                            </div>

                                                            <p className="cart-item-card__sub-price">
                                                                상품가격 {formatPrice(item.totalPrice)} + 배송비{' '}
                                                                {formatPrice(item.shippingFee)}
                                                            </p>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            className="cart-item-card__delete-button"
                                                            onClick={() => handleDelete(item.cartItemId)}
                                                            disabled={actionLoading}
                                                        >
                                                            삭제
                                                        </button>
                                                    </div>

                                                    <div className="cart-item-card__bottom">
                                                        <div className="cart-item-card__quantity-box">
                                                            <button
                                                                type="button"
                                                                className="cart-item-card__quantity-button"
                                                                onClick={() =>
                                                                    handleUpdateQuantity(
                                                                        item.cartItemId,
                                                                        item.quantity - 1,
                                                                    )
                                                                }
                                                                disabled={actionLoading || item.quantity <= 1}
                                                            >
                                                                −
                                                            </button>

                                                            <span className="cart-item-card__quantity-value">
                                                                {item.quantity}
                                                            </span>

                                                            <button
                                                                type="button"
                                                                className="cart-item-card__quantity-button"
                                                                onClick={() =>
                                                                    handleUpdateQuantity(
                                                                        item.cartItemId,
                                                                        item.quantity + 1,
                                                                    )
                                                                }
                                                                disabled={actionLoading}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </section>

                            <aside className="cart-summary-panel">
                                <div className="cart-summary-panel__card">
                                    <h2 className="cart-summary-panel__title">주문 예상 금액</h2>

                                    <div className="cart-summary-panel__row">
                                        <span>총 상품 가격</span>
                                        <strong>{formatPrice(cart.summary.totalProductPrice)}</strong>
                                    </div>

                                    <div className="cart-summary-panel__row">
                                        <span>총 할인 금액</span>
                                        <strong className="cart-summary-panel__discount">
                                            - {formatPrice(cart.summary.discountAmount)}
                                        </strong>
                                    </div>

                                    <div className="cart-summary-panel__row">
                                        <span>총 배송비</span>
                                        <strong>+ {formatPrice(cart.summary.shippingFee)}</strong>
                                    </div>

                                    <div className="cart-summary-panel__divider" />

                                    <div className="cart-summary-panel__total">
                                        <span>최종 결제 금액</span>
                                        <strong>{formatPrice(cart.summary.finalPrice)}</strong>
                                    </div>

                                    <button
                                        type="button"
                                        className="cart-summary-panel__buy-button"
                                        onClick={handleBuy}
                                        disabled={cart.summary.totalQuantity === 0}
                                    >
                                        총 {cart.summary.totalQuantity}개 상품 구매하기
                                    </button>
                                </div>
                            </aside>
                        </div>

                        <section className="cart-coupon-panel">
                            <h2 className="cart-coupon-panel__title">할인쿠폰 적용</h2>

                            <div className="cart-coupon-panel__notice">
                                <p>* 현재는 쿠폰 기능 준비 중이 아닌, 추후 쿠폰 기능 확장 예정입니다.</p>
                            </div>

                            <div className="cart-coupon-panel__placeholder">
                                <label className="cart-coupon-panel__option">
                                    <input
                                        type="radio"
                                        name="coupon-mode"
                                        checked={couponMode === 'preparing'}
                                        onChange={() => setCouponMode('preparing')}
                                    />
                                    <span>현재는 쿠폰 기능 준비 중</span>
                                </label>

                                <label className="cart-coupon-panel__option">
                                    <input
                                        type="radio"
                                        name="coupon-mode"
                                        checked={couponMode === 'none'}
                                        onChange={() => setCouponMode('none')}
                                    />
                                    <span>할인쿠폰 적용 안함</span>
                                </label>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    )
}