import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import * as PortOne from '@portone/browser-sdk/v2'
import SiteHeader from '../../components/SiteHeader.tsx'
import './OrderSheetPage.css'

const API_BASE_URL = 'http://localhost:8080'
const ORDER_SHEET_REDIRECT_STATE_KEY = 'orderSheetRedirectState'

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

type ProductDirectOrderState = {
    mode: 'PRODUCT_DIRECT'
    productId: number
    productName: string
    imageUrl?: string | null
    quantity: number
    price: number
    shippingFee?: number
}

type HotDealDirectOrderState = {
    mode: 'HOTDEAL_DIRECT'
    hotDealId: number
    productId: number | null
    productName: string
    imageUrl?: string | null
    quantity: number
    price: number
    originalPrice?: number
    discountRate?: number
    shippingFee?: number
}

type DirectOrderState = ProductDirectOrderState | HotDealDirectOrderState

type OrderSheetItem = {
    key: string
    cartItemId?: number
    productId: number | null
    hotDealId?: number
    productName: string
    imageUrl?: string | null
    price: number
    quantity: number
    totalPrice: number
    shippingFee: number
    selected?: boolean
    orderType: 'CART' | 'PRODUCT_DIRECT' | 'HOTDEAL_DIRECT'
}

type PaymentOrderType = 'CART' | 'PRODUCT_DIRECT' | 'HOTDEAL_DIRECT'

type DeliveryInfoRequest = {
    receiverName: string
    phoneNumber: string
    address: string
    deliveryMemo: string
}

type PaymentPrepareRequest = {
    paymentOrderType: PaymentOrderType
    productId?: number
    hotDealId?: number
    quantity?: number
    cartItemIds?: number[]
    paymentMethod: PaymentMethod
    deliveryInfo: DeliveryInfoRequest
}

type PaymentPrepareResponse = {
    orderId: number
    paymentId: string
    orderName: string
    totalAmount: number
}

type PaymentCompleteResponse = {
    orderId: number
}

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

function isProductDirectOrderState(state: unknown): state is ProductDirectOrderState {
    if (!state || typeof state !== 'object') return false

    const target = state as ProductDirectOrderState

    return (
        target.mode === 'PRODUCT_DIRECT' &&
        typeof target.productId === 'number' &&
        typeof target.productName === 'string' &&
        typeof target.quantity === 'number' &&
        typeof target.price === 'number'
    )
}

function isHotDealDirectOrderState(state: unknown): state is HotDealDirectOrderState {
    if (!state || typeof state !== 'object') return false

    const target = state as HotDealDirectOrderState

    return (
        target.mode === 'HOTDEAL_DIRECT' &&
        typeof target.hotDealId === 'number' &&
        typeof target.productName === 'string' &&
        typeof target.quantity === 'number' &&
        typeof target.price === 'number'
    )
}

function readOrderSheetRedirectState(): DirectOrderState | null {
    const savedState = window.sessionStorage.getItem(ORDER_SHEET_REDIRECT_STATE_KEY)

    if (!savedState) return null

    try {
        const parsedState: unknown = JSON.parse(savedState)

        if (isProductDirectOrderState(parsedState) || isHotDealDirectOrderState(parsedState)) {
            return parsedState
        }

        window.sessionStorage.removeItem(ORDER_SHEET_REDIRECT_STATE_KEY)
        return null
    } catch {
        window.sessionStorage.removeItem(ORDER_SHEET_REDIRECT_STATE_KEY)
        return null
    }
}

function isPortOneFailureResponse(response: unknown): response is { code: string; message?: string } {
    return (
        typeof response === 'object' &&
        response !== null &&
        'code' in response &&
        typeof (response as { code?: unknown }).code === 'string'
    )
}

async function fetchLoginMember() {
    const candidates = ['/member/myinfo', '/members/myinfo']

    for (const path of candidates) {
        try {
            const response = await axios.get(`${API_BASE_URL}${path}`, {
                withCredentials: true,
            })

            if (response.status === 200 && response.data) {
                return response.data
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status !== 404) {
                throw error
            }
        }
    }

    return null
}

export default function OrderSheetPage() {
    const navigate = useNavigate()
    const location = useLocation()

    const restoredOrderSheetState = useMemo(() => readOrderSheetRedirectState(), [])
    const orderSheetState = location.state ?? restoredOrderSheetState

    const productDirectState = isProductDirectOrderState(orderSheetState)
        ? orderSheetState
        : null

    const hotDealDirectState = isHotDealDirectOrderState(orderSheetState)
        ? orderSheetState
        : null

    const orderMode: 'CART' | 'PRODUCT_DIRECT' | 'HOTDEAL_DIRECT' = hotDealDirectState
        ? 'HOTDEAL_DIRECT'
        : productDirectState
            ? 'PRODUCT_DIRECT'
            : 'CART'

    const [cart, setCart] = useState<CartResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const [receiverName, setReceiverName] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [address, setAddress] = useState('')
    const [deliveryMemo, setDeliveryMemo] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD')

    const loginRedirectedRef = useRef(false)

    function redirectToLogin() {
        if (loginRedirectedRef.current) return

        loginRedirectedRef.current = true

        navigate('/login', {
            replace: true,
            state: {
                from: {
                    pathname: location.pathname,
                    search: location.search,
                    hash: location.hash,
                },
                redirectState: location.state,
            },
        })
    }

    async function loadOrderSheet() {
        setLoading(true)
        setErrorMessage('')

        try {
            const loginMember = await fetchLoginMember()

            if (!loginMember) {
                redirectToLogin()
                return
            }

            if (orderMode !== 'CART') {
                setLoading(false)
                return
            }

            const response = await axios.get<CartResponse>(`${API_BASE_URL}/cart-items`, {
                withCredentials: true,
            })

            setCart(response.data)
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status

                if (status === 401 || status === 403) {
                    redirectToLogin()
                    return
                }
            }

            setErrorMessage(getOrderErrorMessage(error))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadOrderSheet()
    }, [orderMode, location.pathname, location.search, location.hash])

    const orderItems = useMemo<OrderSheetItem[]>(() => {
        if (productDirectState) {
            return [
                {
                    key: `product-${productDirectState.productId}`,
                    productId: productDirectState.productId,
                    productName: productDirectState.productName,
                    imageUrl: productDirectState.imageUrl,
                    price: productDirectState.price,
                    quantity: productDirectState.quantity,
                    totalPrice: productDirectState.price * productDirectState.quantity,
                    shippingFee: productDirectState.shippingFee ?? 0,
                    orderType: 'PRODUCT_DIRECT',
                },
            ]
        }

        if (hotDealDirectState) {
            return [
                {
                    key: `hotdeal-${hotDealDirectState.hotDealId}`,
                    productId: hotDealDirectState.productId,
                    hotDealId: hotDealDirectState.hotDealId,
                    productName: hotDealDirectState.productName,
                    imageUrl: hotDealDirectState.imageUrl,
                    price: hotDealDirectState.price,
                    quantity: hotDealDirectState.quantity,
                    totalPrice: hotDealDirectState.price * hotDealDirectState.quantity,
                    shippingFee: hotDealDirectState.shippingFee ?? 0,
                    orderType: 'HOTDEAL_DIRECT',
                },
            ]
        }

        return (
            cart?.cartItems
                .filter((item) => item.selected)
                .map((item) => ({
                    key: `cart-${item.cartItemId}`,
                    cartItemId: item.cartItemId,
                    productId: item.productId,
                    productName: item.productName,
                    imageUrl: item.imageUrl,
                    price: item.price,
                    quantity: item.quantity,
                    totalPrice: item.totalPrice,
                    shippingFee: item.shippingFee,
                    selected: item.selected,
                    orderType: 'CART',
                })) ?? []
        )
    }, [cart, productDirectState, hotDealDirectState])

    const summary = useMemo<CartSummary>(() => {
        if (orderMode === 'CART' && cart) {
            return cart.summary
        }

        const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0)
        const totalProductPrice = orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
        const shippingFee = orderItems.reduce((sum, item) => sum + item.shippingFee, 0)
        const discountAmount = 0
        const finalPrice = totalProductPrice - discountAmount + shippingFee

        return {
            totalQuantity,
            totalProductPrice,
            discountAmount,
            shippingFee,
            finalPrice,
        }
    }, [cart, orderItems, orderMode])

    function createPaymentPrepareRequest(deliveryInfo: DeliveryInfoRequest): PaymentPrepareRequest {
        if (orderMode === 'CART') {
            const cartItemIds = orderItems
                .map((item) => item.cartItemId)
                .filter((cartItemId): cartItemId is number => typeof cartItemId === 'number')

            if (cartItemIds.length === 0) {
                throw new Error('장바구니 구매 상품이 없습니다.')
            }

            return {
                paymentOrderType: 'CART',
                cartItemIds,
                paymentMethod,
                deliveryInfo,
            }
        }

        if (orderMode === 'HOTDEAL_DIRECT' && hotDealDirectState) {
            return {
                paymentOrderType: 'HOTDEAL_DIRECT',
                hotDealId: hotDealDirectState.hotDealId,
                quantity: hotDealDirectState.quantity,
                paymentMethod,
                deliveryInfo,
            }
        }

        if (orderMode === 'PRODUCT_DIRECT' && productDirectState) {
            return {
                paymentOrderType: 'PRODUCT_DIRECT',
                productId: productDirectState.productId,
                quantity: productDirectState.quantity,
                paymentMethod,
                deliveryInfo,
            }
        }

        throw new Error('주문 정보를 찾을 수 없습니다.')
    }

    async function handleSubmitOrder() {
        if (orderItems.length === 0) {
            alert('주문할 상품이 없습니다.')

            if (orderMode === 'CART') {
                navigate('/cart-items')
            } else {
                navigate('/')
            }

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

        const storeId = import.meta.env.VITE_PORTONE_STORE_ID
        const channelKey = import.meta.env.VITE_PORTONE_CHANNEL_KEY

        if (!storeId || !channelKey) {
            alert('PortOne 결제 설정이 누락되었습니다. 프론트 .env를 확인해주세요.')
            return
        }

        const deliveryInfo = {
            receiverName: receiverName.trim(),
            phoneNumber: phoneNumber.trim(),
            address: address.trim(),
            deliveryMemo: deliveryMemo.trim(),
        }

        try {
            setSubmitting(true)

            const prepareRequest = createPaymentPrepareRequest(deliveryInfo)

            const prepareResponse = await axios.post<PaymentPrepareResponse>(
                `${API_BASE_URL}/payments/prepare`,
                prepareRequest,
                {
                    withCredentials: true,
                },
            )

            const prepared = prepareResponse.data

            const paymentRequest = {
                storeId,
                channelKey,
                paymentId: prepared.paymentId,
                orderName: prepared.orderName,
                totalAmount: prepared.totalAmount,
                currency: 'KRW',
                payMethod: 'EASY_PAY',
            } as const

            const paymentResponse = await PortOne.requestPayment(
                paymentRequest as unknown as Parameters<typeof PortOne.requestPayment>[0],
            )

            if (!paymentResponse) {
                alert('결제가 중단되었습니다.')
                return
            }

            if (isPortOneFailureResponse(paymentResponse)) {
                alert(paymentResponse.message ?? '결제가 취소되었거나 실패했습니다.')
                return
            }

            const completeResponse = await axios.post<PaymentCompleteResponse>(
                `${API_BASE_URL}/payments/complete`,
                {
                    orderId: prepared.orderId,
                    paymentId: prepared.paymentId,
                },
                {
                    withCredentials: true,
                },
            )

            const completed = completeResponse.data

            window.sessionStorage.removeItem(ORDER_SHEET_REDIRECT_STATE_KEY)

            alert('결제가 완료되었습니다.')
            navigate(`/mypage/orders/${completed.orderId}`)
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
                    <div className="order-sheet-page__state-box">
                        주문 정보를 불러오는 중입니다...
                    </div>
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

    if (orderMode === 'CART' && orderItems.length === 0) {
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

    if (orderMode !== 'CART' && orderItems.length === 0) {
        return (
            <div className="order-sheet-page">
                <SiteHeader />
                <main className="order-sheet-page__content">
                    <div className="order-sheet-page__state-box">
                        바로구매 상품 정보를 찾을 수 없습니다. 상품 상세에서 다시 구매를 진행해주세요.
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
                                        onChange={(e) =>
                                            setPhoneNumber(formatPhoneNumber(e.target.value))
                                        }
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
                                {orderItems.map((item) => (
                                    <div key={item.key} className="order-product-card">
                                        <div className="order-product-card__top">
                                            <strong className="order-product-card__name">
                                                {item.productName}
                                            </strong>
                                        </div>

                                        <div className="order-product-card__meta">
                                            <span>
                                                {item.orderType === 'HOTDEAL_DIRECT'
                                                    ? '핫딜상품'
                                                    : '일반상품'}
                                            </span>
                                            <span>/</span>
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
                                <strong>{formatPrice(summary.totalProductPrice)}</strong>
                            </div>

                            <div className="order-summary-card__row">
                                <span>총 할인 금액</span>
                                <strong className="order-summary-card__discount">
                                    - {formatPrice(summary.discountAmount)}
                                </strong>
                            </div>

                            <div className="order-summary-card__row">
                                <span>배송비</span>
                                <strong>{formatPrice(summary.shippingFee)}</strong>
                            </div>

                            <div className="order-summary-card__divider" />

                            <div className="order-summary-card__total">
                                <span>총 결제 금액</span>
                                <strong>{formatPrice(summary.finalPrice)}</strong>
                            </div>

                            <button
                                type="button"
                                className="order-summary-card__submit-button"
                                onClick={handleSubmitOrder}
                                disabled={submitting}
                            >
                                {submitting ? '결제 처리 중...' : '결제하기'}
                            </button>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    )
}