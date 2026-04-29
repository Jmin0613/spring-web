import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080'

export type HotDealStatus = 'READY' | 'ON_SALE' | 'ENDED' | 'STOPPED'

export type AdminHotDealCreateRequest = {
    productId: number
    hotDealPrice: number
    hotDealStock: number
    startTime: string
    endTime: string
}

export type AdminHotDealUpdateRequest = {
    hotDealPrice: number
    hotDealStock: number
    startTime: string
    endTime: string
}

export type AdminHotDealListItem = {
    hotDealId: number
    productId: number

    productName: string
    imageUrl: string | null

    originalPrice: number
    hotDealPrice: number
    discountRate: number
    hotDealStock: number

    startTime: string
    endTime: string
    createdAt: string

    status: HotDealStatus
}

export type AdminHotDealDetail = {
    hotDealId: number
    productId: number

    productName: string
    description: string
    imageUrl: string | null

    originalPrice: number
    hotDealPrice: number
    discountRate: number
    hotDealStock: number

    startTime: string
    endTime: string

    createdAt: string
    updatedAt: string

    status: HotDealStatus
}

export async function createAdminHotDeal(
    request: AdminHotDealCreateRequest,
): Promise<number> {
    const response = await axios.post<number>(
        `${API_BASE_URL}/admin/hotdeals`,
        request,
        {
            withCredentials: true,
        },
    )

    return response.data
}

export async function fetchAdminHotDeals(): Promise<AdminHotDealListItem[]> {
    const response = await axios.get<AdminHotDealListItem[]>(
        `${API_BASE_URL}/admin/hotdeals`,
        {
            withCredentials: true,
        },
    )

    return response.data
}

export async function fetchAdminHotDealDetail(
    hotDealId: string | number,
): Promise<AdminHotDealDetail> {
    const response = await axios.get<AdminHotDealDetail>(
        `${API_BASE_URL}/admin/hotdeals/${hotDealId}`,
        {
            withCredentials: true,
        },
    )

    return response.data
}

export async function updateAdminHotDeal(
    hotDealId: string | number,
    request: AdminHotDealUpdateRequest,
): Promise<void> {
    await axios.patch(
        `${API_BASE_URL}/admin/hotdeals/${hotDealId}`,
        request,
        {
            withCredentials: true,
        },
    )
}

export async function stopAdminHotDeal(hotDealId: string | number): Promise<void> {
    await axios.patch(
        `${API_BASE_URL}/admin/hotdeals/${hotDealId}/stop`,
        {},
        {
            withCredentials: true,
        },
    )
}

export async function resumeAdminHotDeal(hotDealId: string | number): Promise<void> {
    await axios.patch(
        `${API_BASE_URL}/admin/hotdeals/${hotDealId}/resume`,
        {},
        {
            withCredentials: true,
        },
    )
}