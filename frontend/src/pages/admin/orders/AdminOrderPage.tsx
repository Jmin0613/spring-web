import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import SiteHeader from '../../../components/SiteHeader.tsx'
import {
    type AdminOrderDetail,
    type AdminOrderListItem,
    type DeliveryStatus,
    fetchAdminOrderDetail,
    fetchAdminOrders,
    updateAdminOrderDeliveryStatus,
} from '../../../api/adminOrderApi.ts'
import './AdminOrderPage.css'

const API_BASE_URL = 'http://localhost:8080'
const ITEMS_PER_PAGE = 10

// 관리자인지 아닌지 확인용도
type MemberInfo = {
    id: number
    loginId?: string
    name?: string
    nickname?: string
    role?: 'ADMIN' | 'USER'
}

function formatPrice(price: number) {
    return `${price.toLocaleString('ko-KR')}원`
}

function formatDateTime(dateTime: string) {
    const date = new Date(dateTime)

    if (Number.isNaN(date.getTime())) {
        return dateTime
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')

    return `${year}.${month}.${day} ${hour}:${minute}`
}

function getOrderStatusLabel(status: string) {
    if (status === 'ORDERED') return '주문완료'
    if (status === 'CANCELED') return '주문취소'
    return status
}

function getDeliveryStatusLabel(status: DeliveryStatus) {
    if (status === 'READY') return '배송준비중'
    if (status === 'IN_DELIVERY') return '배송중'
    if (status === 'DELIVERED') return '배송완료'
    if (status === 'CANCELED') return '배송취소'
    return status
}

// 배송상태 버튼 문구/동작 설정
function getDeliveryButtonConfig(status: DeliveryStatus) {
    if (status === 'READY') {
        return {
            label: '배송중 처리',
            nextStatus: 'IN_DELIVERY' as DeliveryStatus,
            disabled: false,
        }
    }

    if (status === 'IN_DELIVERY') {
        return {
            label: '배송완료 처리',
            nextStatus: 'DELIVERED' as DeliveryStatus,
            disabled: false,
        }
    }

    if (status === 'DELIVERED') {
        return {
            label: '배송완료',
            nextStatus: null,
            disabled: true,
        }
    }

    if (status === 'CANCELED') {
        return {
            label: '배송취소',
            nextStatus: null,
            disabled: true,
        }
    }

    return {
        label: '상태 없음',
        nextStatus: null,
        disabled: true,
    }
}

function getErrorMessage(error: unknown) {
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

    return '요청 처리 중 오류가 발생했습니다.'
}

export default function AdminOrderPage() {
    const [checkingAdmin, setCheckingAdmin] = useState(true)
    // 관리자 권한 확인 중인지 관리

    const [isAdmin, setIsAdmin] = useState(false)
    // 관리자 여부

    const [orders, setOrders] = useState<AdminOrderListItem[]>([])
    // 관리자 주문 목록 데이터

    const [loading, setLoading] = useState(true)
    // 주문 목록을 불러오는 중인지 관리

    const [error, setError] = useState('')
    // 주문 목록 조회 실패 메세지

    const [openOrderId, setOpenOrderId] = useState<number | null>(null)
    // 현재 상세보기가 열려있는 주문 id

    const [orderDetailMap, setOrderDetailMap] = useState<Record<number, AdminOrderDetail>>({})
    // 한 번 조회한 주문 상세 데이터를 주문 id별로 저장

    const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null)
    // 특정 주문 상세 정보를 불러오는 중인지 관리

    const [detailErrorMap, setDetailErrorMap] = useState<Record<number, string>>({})
    // 특정 주문 상세 조회 실패 메세지 저장

    const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)
    // 배송상태 변경 중인 주문 id. 중복 클릭 방지용.

    const [currentPage, setCurrentPage] = useState(1)
    // 현재 페이지 번호

    const totalPages = Math.max(1, Math.ceil(orders.length / ITEMS_PER_PAGE))

    const pagedOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        return orders.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    }, [orders, currentPage])

    // 관리자 권한 확인
    useEffect(() => {
        async function checkAdmin() {
            try {
                const response = await axios.get<MemberInfo | null>(
                    `${API_BASE_URL}/member/myinfo`,
                    {
                        withCredentials: true,
                    },
                )

                setIsAdmin(response.data?.role === 'ADMIN')
            } catch (error) {
                setIsAdmin(false)
            } finally {
                setCheckingAdmin(false)
            }
        }

        void checkAdmin()
    }, [])

    // 관리자 주문 목록 조회
    useEffect(() => {
        async function loadOrders() {
            try {
                setLoading(true)
                setError('')

                const data = await fetchAdminOrders()
                setOrders(data)
                setCurrentPage(1)
            } catch (error) {
                setError(getErrorMessage(error))
            } finally {
                setLoading(false)
            }
        }

        void loadOrders()
    }, [])

    // 현재 페이지가 전체 페이지보다 커졌을 때 보정
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

    // 주문 상세 열기/닫기
    async function handleToggleDetail(orderId: number) {
        if (openOrderId === orderId) {
            setOpenOrderId(null)
            return
        }

        if (orderDetailMap[orderId]) {
            setOpenOrderId(orderId)
            return
        }

        try {
            setDetailLoadingId(orderId)
            setDetailErrorMap((prev) => {
                const next = { ...prev }
                delete next[orderId]
                return next
            })

            const detail = await fetchAdminOrderDetail(orderId)

            setOrderDetailMap((prev) => ({
                ...prev,
                [orderId]: detail,
            }))

            setOpenOrderId(orderId)
        } catch (error) {
            setDetailErrorMap((prev) => ({
                ...prev,
                [orderId]: getErrorMessage(error),
            }))

            setOpenOrderId(orderId)
        } finally {
            setDetailLoadingId(null)
        }
    }

    // 배송상태 변경
    async function handleUpdateDeliveryStatus(
        order: AdminOrderListItem,
        nextStatus: DeliveryStatus,
    ) {
        const confirmed = window.confirm(
            `주문번호 ${order.orderId}번의 배송상태를 "${getDeliveryStatusLabel(nextStatus)}" 상태로 변경할까요?`,
        )

        if (!confirmed) {
            return
        }

        try {
            setUpdatingOrderId(order.orderId)

            await updateAdminOrderDeliveryStatus(order.orderId, nextStatus)

            setOrders((prev) =>
                prev.map((item) =>
                    item.orderId === order.orderId
                        ? {
                            ...item,
                            deliveryStatus: nextStatus,
                        }
                        : item,
                ),
            )

            setOrderDetailMap((prev) => {
                const currentDetail = prev[order.orderId]

                if (!currentDetail) {
                    return prev
                }

                return {
                    ...prev,
                    [order.orderId]: {
                        ...currentDetail,
                        deliveryStatus: nextStatus,
                    },
                }
            })

            alert('배송상태가 변경되었습니다.')
        } catch (error) {
            alert(getErrorMessage(error))
        } finally {
            setUpdatingOrderId(null)
        }
    }

    if (checkingAdmin) {
        return (
            <div className="admin-order-page">
                <SiteHeader />
                <main className="admin-order-container">
                    <div className="admin-order-state-box">
                        관리자 권한을 확인하는 중입니다...
                    </div>
                </main>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="admin-order-page">
                <SiteHeader />
                <main className="admin-order-container">
                    <div className="admin-order-state-box">
                        관리자만 접근할 수 있는 페이지입니다.
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="admin-order-page">
            <SiteHeader />

            <main className="admin-order-container">
                <section className="admin-order-header">
                    <p className="admin-order-eyebrow">ADMIN ORDER</p>
                    <h1 className="admin-order-title">주문관리</h1>
                </section>

                <section className="admin-order-summary-card">
                    <div>
                        <span className="admin-order-summary-label">전체 주문</span>
                        <strong>{orders.length.toLocaleString('ko-KR')}건</strong>
                    </div>

                    <div>
                        <span className="admin-order-summary-label">배송준비중</span>
                        <strong>
                            {orders
                                .filter((order) => order.deliveryStatus === 'READY')
                                .length.toLocaleString('ko-KR')}
                            건
                        </strong>
                    </div>

                    <div>
                        <span className="admin-order-summary-label">배송중</span>
                        <strong>
                            {orders
                                .filter((order) => order.deliveryStatus === 'IN_DELIVERY')
                                .length.toLocaleString('ko-KR')}
                            건
                        </strong>
                    </div>

                    <div>
                        <span className="admin-order-summary-label">배송완료</span>
                        <strong>
                            {orders
                                .filter((order) => order.deliveryStatus === 'DELIVERED')
                                .length.toLocaleString('ko-KR')}
                            건
                        </strong>
                    </div>
                </section>

                {loading ? (
                    <div className="admin-order-state-box">
                        주문 목록을 불러오는 중입니다...
                    </div>
                ) : error ? (
                    <div className="admin-order-state-box">{error}</div>
                ) : orders.length === 0 ? (
                    <div className="admin-order-state-box">들어온 주문이 없습니다.</div>
                ) : (
                    <>
                        <section className="admin-order-list">
                            {pagedOrders.map((order) => {
                                const detail = orderDetailMap[order.orderId]
                                const isOpen = openOrderId === order.orderId
                                const isDetailLoading = detailLoadingId === order.orderId
                                const detailError = detailErrorMap[order.orderId]
                                const deliveryButton = getDeliveryButtonConfig(order.deliveryStatus)
                                const isUpdating = updatingOrderId === order.orderId

                                return (
                                    <article className="admin-order-card" key={order.orderId}>
                                        <div className="admin-order-card-main">
                                            <div className="admin-order-card-left">
                                                <div className="admin-order-number-row">
                                                    <strong>주문번호 {order.orderId}</strong>
                                                    <span>{formatDateTime(order.orderDate)}</span>
                                                </div>

                                                <div className="admin-order-badge-row">
                                                    <span className="admin-order-badge">
                                                        주문상태 {getOrderStatusLabel(order.orderStatus)}
                                                    </span>
                                                    <span className="admin-order-badge admin-order-badge--delivery">
                                                        배송상태 {getDeliveryStatusLabel(order.deliveryStatus)}
                                                    </span>
                                                </div>

                                                <div className="admin-order-buyer-info">
                                                    <span>구매자 : {order.memberName} / </span>
                                                    <span>아이디 : {order.memberLoginId} / </span>
                                                    {order.memberNickName && (
                                                        <span>닉네임 : {order.memberNickName}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="admin-order-card-right">
                                                <div className="admin-order-total-price">
                                                    {formatPrice(order.totalPrice)}
                                                </div>

                                                <div className="admin-order-item-count">
                                                    상품 종류 {order.itemCount}개
                                                </div>

                                                <div className="admin-order-action-row">
                                                    <button
                                                        type="button"
                                                        className="admin-order-detail-button"
                                                        onClick={() => handleToggleDetail(order.orderId)}
                                                    >
                                                        {isOpen ? '상세 닫기' : '상세보기'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={
                                                            deliveryButton.disabled
                                                                ? 'admin-order-delivery-button admin-order-delivery-button--disabled'
                                                                : 'admin-order-delivery-button'
                                                        }
                                                        onClick={() => {
                                                            if (!deliveryButton.disabled && deliveryButton.nextStatus) {
                                                                void handleUpdateDeliveryStatus(
                                                                    order,
                                                                    deliveryButton.nextStatus,
                                                                )
                                                            }
                                                        }}
                                                        disabled={deliveryButton.disabled || isUpdating}
                                                    >
                                                        {isUpdating ? '처리 중...' : deliveryButton.label}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {isOpen && (
                                            <div className="admin-order-detail-panel">
                                                {isDetailLoading ? (
                                                    <div className="admin-order-detail-state">
                                                        주문 상세를 불러오는 중입니다...
                                                    </div>
                                                ) : detailError ? (
                                                    <div className="admin-order-detail-state admin-order-detail-state--error">
                                                        {detailError}
                                                    </div>
                                                ) : detail ? (
                                                    <>
                                                        <div className="admin-order-detail-grid">
                                                            <section className="admin-order-detail-section">
                                                                <h3>구매자 정보</h3>
                                                                <div className="admin-order-detail-divider" />

                                                                <div className="admin-order-detail-info-list">
                                                                    <p>
                                                                        <span className="admin-order-detail-label">이름</span>
                                                                        <span>{detail.memberName}</span>
                                                                    </p>
                                                                    <p>
                                                                        <span className="admin-order-detail-label">아이디</span>
                                                                        <span>{detail.memberLoginId}</span>
                                                                    </p>
                                                                    <p>
                                                                        <span className="admin-order-detail-label">이메일</span>
                                                                        <span>{detail.memberEmail ?? '-'}</span>
                                                                    </p>
                                                                </div>
                                                            </section>

                                                            <section className="admin-order-detail-section">
                                                                <h3>배송 정보</h3>
                                                                <div className="admin-order-detail-divider" />

                                                                <div className="admin-order-detail-info-list">
                                                                    <p>
                                                                        <span className="admin-order-detail-label">받는 사람</span>
                                                                        <span>{detail.receiverName}</span>
                                                                    </p>
                                                                    <p>
                                                                        <span className="admin-order-detail-label">연락처</span>
                                                                        <span>{detail.phoneNumber}</span>
                                                                    </p>
                                                                    <p>
                                                                        <span className="admin-order-detail-label">주소</span>
                                                                        <span>{detail.address}</span>
                                                                    </p>
                                                                    <p>
                                                                        <span className="admin-order-detail-label">배송메모</span>
                                                                        <span>{detail.deliveryMemo ?? '-'}</span>
                                                                    </p>
                                                                </div>
                                                            </section>
                                                        </div>

                                                        <section className="admin-order-item-section">
                                                            <h3>주문 상품</h3>

                                                            <div className="admin-order-item-table">
                                                                <div className="admin-order-item-head">
                                                                    <span>상품명</span>
                                                                    <span>수량</span>
                                                                    <span>주문가</span>
                                                                    <span>합계</span>
                                                                </div>

                                                                {detail.orderItems.map((item) => (
                                                                    <div
                                                                        className="admin-order-item-row"
                                                                        key={item.orderItemId}
                                                                    >
                                                                        <span>{item.productNameSnapshot}</span>
                                                                        <span>{item.quantity}개</span>
                                                                        <span>{formatPrice(item.orderPrice)}</span>
                                                                        <span>{formatPrice(item.itemTotalPrice)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </section>
                                                    </>
                                                ) : (
                                                    <div className="admin-order-detail-state">
                                                        주문 상세 정보를 찾을 수 없습니다.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </article>
                                )
                            })}
                        </section>

                        {totalPages > 1 && (
                            <div className="admin-order-pagination">
                                <button
                                    type="button"
                                    className="admin-order-page-button"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    이전
                                </button>

                                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        className={
                                            page === currentPage
                                                ? 'admin-order-page-button admin-order-page-button--active'
                                                : 'admin-order-page-button'
                                        }
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    className="admin-order-page-button"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    다음
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}