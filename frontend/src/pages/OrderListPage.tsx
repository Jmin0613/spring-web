import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import SiteHeader from '../components/SiteHeader'
import './OrderListPage.css'

const API_BASE_URL = 'http://localhost:8080'

type OrderItem = {
    orderItemId: number
    productId: number
    productNameSnapshot: string
    imageUrlSnapshot: string
    orderPrice: number
    quantity: number
    itemTotalPrice: number
}

type OrderListResponse = {
    orderId: number
    orderDate: string
    orderStatus: string
    deliveryStatus: string
    orderItems: OrderItem[]
}

function formatPrice(price?: number | null) {
    return `${(price ?? 0).toLocaleString('ko-KR')}원`
}

function formatDate(dateString: string) {
    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
        return dateString
    }

    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
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

    return '주문목록을 불러오지 못했습니다.'
}

function getProductEmoji(name?: string) {
    if (!name) return '🎁'
    return '🎁'
}

function getOrderTotalPrice(orderItems: OrderItem[]) {
    return orderItems.reduce((sum, item) => sum + item.itemTotalPrice, 0)
}

export default function OrderListPage() {
    const navigate = useNavigate()

    const [orders, setOrders] = useState<OrderListResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        async function loadOrders() {
            try {
                setLoading(true)
                setErrorMessage('')

                const response = await axios.get<OrderListResponse[]>(
                    `${API_BASE_URL}/mypage/orders`,
                    { withCredentials: true },
                )

                setOrders(response.data)
            } catch (error) {
                setErrorMessage(getOrderErrorMessage(error))
            } finally {
                setLoading(false)
            }
        }

        void loadOrders()
    }, [])

    return (
        <div className="order-list-page">
            <SiteHeader />

            <main className="order-list-page__content">
                <header className="order-list-page__header">
                    <h1 className="order-list-page__title">주문목록</h1>
                </header>

                {loading ? (
                    <div className="order-list-page__state-box">
                        주문목록을 불러오는 중입니다...
                    </div>
                ) : errorMessage ? (
                    <div className="order-list-page__state-box">{errorMessage}</div>
                ) : orders.length === 0 ? (
                    <div className="order-list-page__state-box">
                        아직 주문한 내역이 없습니다.
                    </div>
                ) : (
                    <div className="order-list-page__list">
                        {orders.map((order) => {
                            const firstItem = order.orderItems[0]
                            const extraCount = order.orderItems.length - 1
                            const totalPrice = getOrderTotalPrice(order.orderItems)

                            return (
                                <article key={order.orderId} className="order-list-card">
                                    <div className="order-list-card__top">
                                        <div className="order-list-card__top-left">
                                            <strong className="order-list-card__order-date">
                                                {formatDate(order.orderDate)}
                                            </strong>
                                            <span className="order-list-card__order-id">
                                                주문번호 {order.orderId}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            className="order-list-card__detail-button"
                                            onClick={() => navigate(`/mypage/orders/${order.orderId}`)}
                                        >
                                            상세보기
                                        </button>
                                    </div>

                                    <div className="order-list-card__status-row">
                                        <span className="order-list-card__status">
                                            주문상태 {order.orderStatus}
                                        </span>
                                        <span className="order-list-card__status">
                                            배송상태 {order.deliveryStatus}
                                        </span>
                                    </div>

                                    {firstItem && (
                                        <div className="order-list-card__main">
                                            <div className="order-list-card__image-box">
                                                <span className="order-list-card__emoji">
                                                    {getProductEmoji(firstItem.productNameSnapshot)}
                                                </span>
                                            </div>

                                            <div className="order-list-card__body">
                                                <div className="order-list-card__body-top">
                                                    <div className="order-list-card__body-left">
                                                        <h2 className="order-list-card__product-name">
                                                            {firstItem.productNameSnapshot}
                                                            {extraCount > 0 && (
                                                                <span className="order-list-card__extra-text">
                                                                    {' '}외 {extraCount}건
                                                                </span>
                                                            )}
                                                        </h2>

                                                        <div className="order-list-card__meta">
                                                            <span>대표상품 수량 {firstItem.quantity}개</span>
                                                            <span>총 상품 수 {order.orderItems.length}종</span>
                                                        </div>
                                                    </div>

                                                    <strong className="order-list-card__price">
                                                        {formatPrice(totalPrice)}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}