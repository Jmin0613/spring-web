import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080'

export type InquiryStatus = 'WAITING' | 'ANSWERED'

export type AdminInquiryListItem = {
    inquiryId: number

    productId: number
    productNameSnapshot: string

    memberId: number
    writerName: string
    writerNickName: string | null

    title: string
    status: InquiryStatus
    secret: boolean

    createdAt: string
    answeredAt: string | null
}

export type AdminInquiryDetail = {
    inquiryId: number

    productId: number
    productNameSnapshot: string

    memberId: number
    writerName: string
    writerNickName: string | null

    title: string
    content: string

    secret: boolean
    status: InquiryStatus

    answerContent: string | null

    createdAt: string
    updatedAt: string | null
    answeredAt: string | null
}

export type AdminInquiryAnswerRequest = {
    answerContent: string
}

export async function fetchAdminInquiries(): Promise<AdminInquiryListItem[]> {
    const response = await axios.get<AdminInquiryListItem[]>(
        `${API_BASE_URL}/admin/inquiries`,
        {
            withCredentials: true,
        },
    )

    return response.data
}

export async function fetchAdminInquiryDetail(
    inquiryId: string | number,
): Promise<AdminInquiryDetail> {
    const response = await axios.get<AdminInquiryDetail>(
        `${API_BASE_URL}/admin/inquiries/${inquiryId}`,
        {
            withCredentials: true,
        },
    )

    return response.data
}

export async function answerAdminInquiry(
    productId: string | number,
    inquiryId: string | number,
    request: AdminInquiryAnswerRequest,
): Promise<void> {
    await axios.patch(
        `${API_BASE_URL}/admin/products/${productId}/inquiries/${inquiryId}/answer`,
        request,
        {
            withCredentials: true,
        },
    )
}