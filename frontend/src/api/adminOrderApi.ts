import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080'

export type DeliveryStatus = 'READY' | 'IN_DELIVERY' | 'DELIVERED' | 'CANCELED'
export type OrderStatus = 'ORDERED' | 'CANCELED'

export type AdminOrderListItem = {
    orderId: number
    orderDate: string

    orderStatus: OrderStatus
    deliveryStatus: DeliveryStatus

    memberId: number
    memberLoginId: string
    memberName: string
    memberNickName: string | null

    totalPrice: number
    itemCount: number
}

export type AdminOrderItem = {
    orderItemId: number
    productId: number
    productNameSnapshot: string
    orderPrice: number
    quantity: number
    itemTotalPrice: number
}

export type AdminOrderDetail = {
    orderId: number
    orderDate: string

    orderStatus: OrderStatus
    deliveryStatus: DeliveryStatus

    memberName: string
    memberLoginId: string
    memberEmail: string | null

    receiverName: string
    phoneNumber: string
    address: string
    deliveryMemo: string | null

    totalPrice: number
    orderItems: AdminOrderItem[]
}

export async function fetchAdminOrders(): Promise<AdminOrderListItem[]> {
    const response = await axios.get<AdminOrderListItem[]>(
        `${API_BASE_URL}/admin/orders`,
        {
            withCredentials: true,
        },
    )

    return response.data
}

export async function fetchAdminOrderDetail(
    orderId: string | number,
): Promise<AdminOrderDetail> {
    const response = await axios.get<AdminOrderDetail>(
        `${API_BASE_URL}/admin/orders/${orderId}`,
        {
            withCredentials: true,
        },
    )

    return response.data
}

export async function updateAdminOrderDeliveryStatus(
    orderId: string | number,
    deliveryStatus: DeliveryStatus,
): Promise<void> {
    await axios.patch(
        `${API_BASE_URL}/admin/orders/${orderId}/delivery-status`,
        {
            deliveryStatus,
        },
        {
            withCredentials: true,
        },
    )
}