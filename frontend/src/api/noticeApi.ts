import axios from 'axios'
import type { NoticeDetail, NoticeListItem } from '../types/notice'

const API_BASE_URL = '/api'

export type NoticeFormRequest = {
    title: string
    content: string
}

export async function fetchNoticeList(): Promise<NoticeListItem[]> {
    const response
        = await axios.get<NoticeListItem[]>(`${API_BASE_URL}/notices`)
    return response.data
}

export async function fetchNoticeDetail(noticeId: string | number): Promise<NoticeDetail> {
    const response
        = await axios.get<NoticeDetail>(`${API_BASE_URL}/notices/${noticeId}`)
    return response.data
}

export async function createNotice(request: NoticeFormRequest) : Promise<number> {
    const response = await axios.post<number>(
        `${API_BASE_URL}/admin/notice`,
        request,
        {
            withCredentials : true,
        },
    )
    return response.data
}

export async function updateNotice(noticeId: string | number, request: NoticeFormRequest,) : Promise<void> {
    await axios.patch(
        `${API_BASE_URL}/admin/notices/${noticeId}`,
        request,
        {
            withCredentials : true,
        },
    )
}

export async function deleteNotice(noticeId: string | number) {
    await axios.delete(`${API_BASE_URL}/admin/notices/${noticeId}`, {
        withCredentials : true,
    })
}