import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import SiteHeader from '../components/SiteHeader'
import './OrderSheetPage.css'

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

type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'PHONE' | 'VIRTUAL_ACCOUNT'

function formatPrice(price?: number | null) {
    return `${(price ?? 0).toLocaleString('ko-KR')}원`
}

function formatPhoneNumber(value: string) {
    const numbersOnly = value.replace(/\D/g, '').slice(0, 11)

    if (numbersOnly.length <= 3) return numbersOnly
    if (numbersOnly.length <= 7) {
        return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`
    }
    return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7)}`
}

function getOrderErrorMessage(error: unknown) {
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

    return '주문 정보를 불러오지 못했습니다.'
}

export default function OrderSheetPage() {
    const navigate = useNavigate()

    const [cart, setCart] = useState<CartResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const [receiverName, setReceiverName] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [address, setAddress] = useState('')
    const [deliveryMemo, setDeliveryMemo] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER')

    async function loadOrderSheet() {
        try {
            setLoading(true)
            setErrorMessage('')

            const response = await axios.get<CartResponse>(`${API_BASE_URL}/cart-items`, {
                withCredentials: true,
            })

            setCart(response.data)
        } catch (error) {
            setErrorMessage(getOrderErrorMessage(error))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadOrderSheet()
    }, [])

    const selectedItems = useMemo(() => {
        return cart?.cartItems.filter((item) => item.selected) ?? []
    }, [cart])

    async function handleSubmitOrder() {
        if (!cart || selectedItems.length === 0) {
            alert('주문할 상품이 없습니다.')
            navigate('/cart-items')
            return
        }

        if (!receiverName.trim()) {
            alert('받는 사람을 입력해주세요.')
            return
        }

        if (!phoneNumber.trim()) {
            alert('전화번호를 입력해주세요.')
            return
        }

        if (!address.trim()) {
            alert('주소를 입력해주세요.')
            return
        }

        try {
            setSubmitting(true)

            const response = await axios.post<number>(
                `${API_BASE_URL}/cart-items/buy`,
                {
                    cartItemIds: selectedItems.map((item) => item.cartItemId),
                    paymentMethod,
                    deliveryInfo: {
                        receiverName,
                        phoneNumber,
                        address,
                        deliveryMemo,
                    },
                },
                {
                    withCredentials: true,
                },
            )

            const orderId = response.data

            alert('주문이 완료되었습니다.')
            navigate(`/mypage/orders/${orderId}`)
        } catch (error) {
            alert(getOrderErrorMessage(error))
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="order-sheet-page">
                <SiteHeader />
                <main className="order-sheet-page__content">
                    <div className="order-sheet-page__state-box">주문 정보를 불러오는 중입니다...</div>
                </main>
            </div>
        )
    }

    if (errorMessage) {
        return (
            <div className="order-sheet-page">
                <SiteHeader />
                <main className="order-sheet-page__content">
                    <div className="order-sheet-page__state-box">{errorMessage}</div>
                </main>
            </div>
        )
    }

    if (!cart || selectedItems.length === 0) {
        return (
            <div className="order-sheet-page">
                <SiteHeader />
                <main className="order-sheet-page__content">
                    <div className="order-sheet-page__state-box">
                        선택된 상품이 없습니다. 장바구니에서 구매할 상품을 먼저 선택해주세요.
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="order-sheet-page">
            <SiteHeader />

            <main className="order-sheet-page__content">
                <header className="order-sheet-page__header">
                    <h1 className="order-sheet-page__title">주문/결제</h1>
                </header>

                <div className="order-sheet-page__layout">
                    <section className="order-sheet-page__main">
                        <section className="order-section">
                            <h2 className="order-section__title">배송지</h2>

                            <div className="order-delivery-form">
                                <div className="order-form-row">
                                    <label className="order-form-label">받는 사람</label>
                                    <input
                                        className="order-form-input"
                                        value={receiverName}
                                        onChange={(e) => setReceiverName(e.target.value)}
                                        placeholder="받는 사람 이름을 입력해주세요"
                                    />
                                </div>

                                <div className="order-form-row">
                                    <label className="order-form-label">전화번호</label>
                                    <input
                                        className="order-form-input"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                                        placeholder="전화번호를 입력해주세요"
                                    />
                                </div>

                                <div className="order-form-row">
                                    <label className="order-form-label">주소</label>
                                    <input
                                        className="order-form-input"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="배송받을 주소를 입력해주세요"
                                    />
                                </div>

                                <div className="order-form-row">
                                    <label className="order-form-label">배송 요청사항</label>
                                    <input
                                        className="order-form-input"
                                        value={deliveryMemo}
                                        onChange={(e) => setDeliveryMemo(e.target.value)}
                                        placeholder="ex) 현관 앞에 놔주세요"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="order-section">
                            <h2 className="order-section__title">결제수단</h2>

                            <div className="order-payment-methods">
                                <label className="order-payment-option">
                                    <input
                                        type="radio"
                                        name="payment-method"
                                        checked={paymentMethod === 'BANK_TRANSFER'}
                                        onChange={() => setPaymentMethod('BANK_TRANSFER')}
                                    />
                                    <span>계좌이체</span>
                                </label>

                                <label className="order-payment-option">
                                    <input
                                        type="radio"
                                        name="payment-method"
                                        checked={paymentMethod === 'CARD'}
                                        onChange={() => setPaymentMethod('CARD')}
                                    />
                                    <span>신용/체크카드</span>
                                </label>

                                <label className="order-payment-option">
                                    <input
                                        type="radio"
                                        name="payment-method"
                                        checked={paymentMethod === 'PHONE'}
                                        onChange={() => setPaymentMethod('PHONE')}
                                    />
                                    <span>휴대폰</span>
                                </label>

                                <label className="order-payment-option">
                                    <input
                                        type="radio"
                                        name="payment-method"
                                        checked={paymentMethod === 'VIRTUAL_ACCOUNT'}
                                        onChange={() => setPaymentMethod('VIRTUAL_ACCOUNT')}
                                    />
                                    <span>무통장입금(가상계좌)</span>
                                </label>
                            </div>
                        </section>

                        <section className="order-section">
                            <h2 className="order-section__title">배송 상품</h2>

                            <div className="order-product-list">
                                {selectedItems.map((item) => (
                                    <div key={item.cartItemId} className="order-product-card">
                                        <div className="order-product-card__top">
                                            <strong className="order-product-card__name">
                                                {item.productName}
                                            </strong>
                                        </div>

                                        <div className="order-product-card__meta">
                                            <span>수량 {item.quantity}개</span>
                                            <span>/</span>
                                            <span>상품금액 {formatPrice(item.totalPrice)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </section>

                    <aside className="order-sheet-page__summary">
                        <div className="order-summary-card">
                            <h2 className="order-summary-card__title">최종 결제 금액</h2>

                            <div className="order-summary-card__row">
                                <span>총 상품 가격</span>
                                <strong>{formatPrice(cart.summary.totalProductPrice)}</strong>
                            </div>

                            <div className="order-summary-card__row">
                                <span>총 할인 금액</span>
                                <strong className="order-summary-card__discount">
                                    - {formatPrice(cart.summary.discountAmount)}
                                </strong>
                            </div>

                            <div className="order-summary-card__row">
                                <span>배송비</span>
                                <strong>{formatPrice(cart.summary.shippingFee)}</strong>
                            </div>

                            <div className="order-summary-card__divider" />

                            <div className="order-summary-card__total">
                                <span>총 결제 금액</span>
                                <strong>{formatPrice(cart.summary.finalPrice)}</strong>
                            </div>

                            <button
                                type="button"
                                className="order-summary-card__submit-button"
                                onClick={handleSubmitOrder}
                                disabled={submitting}
                            >
                                {submitting ? '주문 처리 중...' : '결제하기'}
                            </button>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    )
}