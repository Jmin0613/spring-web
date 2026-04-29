import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import SiteHeader from '../../components/SiteHeader.tsx'
import './OrderDetailPage.css'

const API_BASE_URL = 'http://localhost:8080'

type OrderItem = {
    orderItemId: number
    productId: number
    productNameSnapshot: string
    imageUrlSnapshot?: string | null
    orderPrice: number
    quantity: number
    itemTotalPrice: number
}

type DeliveryInfo = {
    receiverName: string
    phoneNumber: string
    address: string
    deliveryMemo: string
}

type OrderDetailResponse = {
    orderId: number
    orderDate: string
    orderStatus: string
    deliveryStatus: string
    totalPrice: number
    orderItems: OrderItem[]
    deliveryInfo: DeliveryInfo
}

function formatPrice(price?: number | null) {
    return `${(price ?? 0).toLocaleString('ko-KR')}원`
}

function formatDate(dateString: string) {
    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
        return dateString
    }

    return date.toLocaleString('ko-KR')
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

    return '주문 상세 정보를 불러오지 못했습니다.'
}

function OrderProductImage({
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
        return <span className="order-detail-product-card__image-placeholder">상품</span>
    }

    return (
        <img
            className="order-detail-product-card__image-img"
            src={imageUrl}
            alt={alt}
            onError={() => setImageError(true)}
        />
    )
}

export default function OrderDetailPage() {
    const { orderId } = useParams()
    const navigate = useNavigate()

    const [order, setOrder] = useState<OrderDetailResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        async function loadOrderDetail() {
            try {
                setLoading(true)
                setErrorMessage('')

                const response = await axios.get<OrderDetailResponse>(
                    `${API_BASE_URL}/mypage/orders/${orderId}`,
                    { withCredentials: true },
                )

                setOrder(response.data)
            } catch (error) {
                setErrorMessage(getOrderErrorMessage(error))
            } finally {
                setLoading(false)
            }
        }

        if (orderId) {
            void loadOrderDetail()
        }
    }, [orderId])

    return (
        <div className="order-detail-page">
            <SiteHeader />

            <main className="order-detail-page__content">
                <header className="order-detail-page__header">
                    <h1 className="order-detail-page__title">주문 상세</h1>
                </header>

                {loading ? (
                    <div className="order-detail-page__state-box">
                        주문 상세 정보를 불러오는 중입니다...
                    </div>
                ) : errorMessage ? (
                    <div className="order-detail-page__state-box">{errorMessage}</div>
                ) : !order ? (
                    <div className="order-detail-page__state-box">
                        주문 정보를 찾을 수 없습니다.
                    </div>
                ) : (
                    <div className="order-detail-page__layout">
                        <section className="order-detail-page__main">
                            <section className="order-detail-section">
                                <h2 className="order-detail-section__title">주문 정보</h2>

                                <div className="order-detail-info-list">
                                    <div className="order-detail-info-row">
                                        <span className="order-detail-info-label">주문번호</span>
                                        <strong>{order.orderId}</strong>
                                    </div>

                                    <div className="order-detail-info-row">
                                        <span className="order-detail-info-label">주문일시</span>
                                        <strong>{formatDate(order.orderDate)}</strong>
                                    </div>

                                    <div className="order-detail-info-row">
                                        <span className="order-detail-info-label">주문상태</span>
                                        <strong>{order.orderStatus}</strong>
                                    </div>

                                    <div className="order-detail-info-row">
                                        <span className="order-detail-info-label">배송상태</span>
                                        <strong>{order.deliveryStatus}</strong>
                                    </div>
                                </div>
                            </section>

                            <section className="order-detail-section">
                                <h2 className="order-detail-section__title">배송지 정보</h2>

                                <div className="order-detail-info-list">
                                    <div className="order-detail-info-row">
                                        <span className="order-detail-info-label">받는 사람</span>
                                        <strong>{order.deliveryInfo?.receiverName}</strong>
                                    </div>

                                    <div className="order-detail-info-row">
                                        <span className="order-detail-info-label">전화번호</span>
                                        <strong>{order.deliveryInfo?.phoneNumber}</strong>
                                    </div>

                                    <div className="order-detail-info-row order-detail-info-row--column">
                                        <span className="order-detail-info-label">주소</span>
                                        <strong>{order.deliveryInfo?.address}</strong>
                                    </div>

                                    <div className="order-detail-info-row order-detail-info-row--column">
                                        <span className="order-detail-info-label">
                                            배송 요청사항
                                        </span>
                                        <strong>{order.deliveryInfo?.deliveryMemo || '-'}</strong>
                                    </div>
                                </div>
                            </section>

                            <section className="order-detail-section">
                                <h2 className="order-detail-section__title">주문 상품</h2>

                                <div className="order-detail-product-list">
                                    {order.orderItems.map((item) => (
                                        <article
                                            key={item.orderItemId}
                                            className="order-detail-product-card"
                                        >
                                            <div className="order-detail-product-card__image-box">
                                                <OrderProductImage
                                                    imageUrl={item.imageUrlSnapshot}
                                                    alt={item.productNameSnapshot}
                                                />
                                            </div>

                                            <div className="order-detail-product-card__body">
                                                <h3 className="order-detail-product-card__name">
                                                    {item.productNameSnapshot}
                                                </h3>

                                                <div className="order-detail-product-card__meta">
                                                    <span>수량 {item.quantity}개</span>
                                                    <span>개당 {formatPrice(item.orderPrice)}</span>
                                                </div>

                                                <strong className="order-detail-product-card__price">
                                                    {formatPrice(item.itemTotalPrice)}
                                                </strong>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        </section>

                        <aside className="order-detail-page__summary">
                            <div className="order-detail-summary-card">
                                <h2 className="order-detail-summary-card__title">결제 정보</h2>

                                <div className="order-detail-summary-card__row">
                                    <span>총 결제 금액</span>
                                    <strong>{formatPrice(order.totalPrice)}</strong>
                                </div>

                                <button
                                    type="button"
                                    className="order-detail-summary-card__button"
                                    onClick={() => navigate('/mypage/orders')}
                                >
                                    주문목록 보기
                                </button>
                            </div>
                        </aside>
                    </div>
                )}
            </main>
        </div>
    )
}