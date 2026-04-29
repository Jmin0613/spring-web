import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import SiteHeader from '../../components/SiteHeader.tsx'
import './OrderListPage.css'

const API_BASE_URL = 'http://localhost:8080'

type OrderItem = {
    orderItemId: number
    productId: number
    productNameSnapshot: string
    imageUrl?: string | null
    imageUrlSnapshot?: string | null
    orderPrice: number
    quantity: number
    itemTotalPrice: number
    reviewed: boolean
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

function getOrderStatusLabel(status: string) {
    if (status === 'ORDERED') return '주문완료'
    if (status === 'CANCELED') return '주문취소'
    return status
}

function getDeliveryStatusLabel(status: string) {
    if (status === 'READY') return '배송준비중'
    if (status === 'IN_DELIVERY') return '배송중'
    if (status === 'DELIVERED') return '배송완료'
    if (status === 'CANCELED') return '배송취소'
    return status
}

function getOrderTotalPrice(orderItems: OrderItem[]) {
    return orderItems.reduce((sum, item) => sum + item.itemTotalPrice, 0)
}

function getOrderItemImageUrl(item: OrderItem) {
    return item.imageUrlSnapshot ?? item.imageUrl ?? null
}

function OrderListProductImage({
                                   imageUrl,
                                   alt,
                               }: {
    imageUrl?: string | null
    alt: string
}) {
    const [imageError, setImageError] = useState(false)

    useEffect(() => {
        setImageError(false)
    }, [imageUrl])

    if (!imageUrl || imageError) {
        return <span className="order-list-item__image-placeholder">상품</span>
    }

    return (
        <img
            className="order-list-item__image-img"
            src={imageUrl}
            alt={alt}
            onError={() => setImageError(true)}
        />
    )
}

// function canWriteReview(order: OrderListResponse) {
//     return order.deliveryStatus === 'DELIVERED'
// }

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
                    {
                        withCredentials: true,
                    },
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

    function handleReviewClick(order: OrderListResponse, item: OrderItem) {
        if (item.reviewed === true) {
            alert('이미 리뷰를 작성한 상품입니다.')
            return
        }

        if (order.deliveryStatus !== 'DELIVERED') {
            alert('배송완료된 상품만 리뷰를 작성할 수 있습니다.')
            return
        }

        navigate(`/mypage/reviews/write?productId=${item.productId}&orderItemId=${item.orderItemId}`)
    }

    return (
        <div className="order-list-page">
            <SiteHeader />

            <main className="order-list-page__content">
                <section className="order-list-page__header">
                    <h1 className="order-list-page__title">주문목록</h1>
                </section>

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
                    <section className="order-list-page__list">
                        {orders.map((order) => {
                            const totalPrice = getOrderTotalPrice(order.orderItems)
                            // const reviewEnabled = canWriteReview(order)

                            return (
                                <article className="order-list-card" key={order.orderId}>
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
                                            className="order-list-card__detail-button"
                                            type="button"
                                            onClick={() =>
                                                navigate(`/mypage/orders/${order.orderId}`)
                                            }
                                        >
                                            상세보기
                                        </button>
                                    </div>

                                    <div className="order-list-card__status-row">
                                        <span className="order-list-card__status">
                                            주문상태 {getOrderStatusLabel(order.orderStatus)}
                                        </span>
                                        <span className="order-list-card__status">
                                            배송상태 {getDeliveryStatusLabel(order.deliveryStatus)}
                                        </span>
                                    </div>

                                    <div className="order-list-card__items">
                                        {order.orderItems.map((item) => {
                                            const reviewCompleted = item.reviewed === true
                                            const reviewEnabled =
                                                order.deliveryStatus === 'DELIVERED' &&
                                                !reviewCompleted

                                            return (
                                                <div
                                                    className="order-list-item"
                                                    key={item.orderItemId}
                                                >
                                                    <div className="order-list-item__image-box">
                                                        <OrderListProductImage
                                                            imageUrl={getOrderItemImageUrl(item)}
                                                            alt={item.productNameSnapshot}
                                                        />
                                                    </div>

                                                    <div className="order-list-item__body">
                                                        <h2 className="order-list-item__name">
                                                            {item.productNameSnapshot}
                                                        </h2>

                                                        <div className="order-list-item__meta">
                                                            <span>수량 {item.quantity}개</span>
                                                            <span>
                                                                구매가 {formatPrice(item.orderPrice)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="order-list-item__right">
                                                        <strong className="order-list-item__price">
                                                            {formatPrice(item.itemTotalPrice)}
                                                        </strong>

                                                        <button
                                                            className={
                                                                reviewCompleted
                                                                    ? 'order-list-item__review-button order-list-item__review-button--completed'
                                                                    : reviewEnabled
                                                                        ? 'order-list-item__review-button'
                                                                        : 'order-list-item__review-button order-list-item__review-button--disabled'
                                                            }
                                                            type="button"
                                                            onClick={() =>
                                                                handleReviewClick(order, item)
                                                            }
                                                            disabled={!reviewEnabled}
                                                        >
                                                            {reviewCompleted
                                                                ? '리뷰 등록 완료'
                                                                : '리뷰 작성하기'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <div className="order-list-card__bottom">
                                        <span>총 상품 {order.orderItems.length}종</span>
                                        <strong>총 결제금액 {formatPrice(totalPrice)}</strong>
                                    </div>
                                </article>
                            )
                        })}
                    </section>
                )}
            </main>
        </div>
    )
}