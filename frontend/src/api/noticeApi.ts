import axios from 'axios'
import type { NoticeDetail, NoticeListItem } from '../types/notice'

const API_BASE_URL = 'http://localhost:8080'

export async function fetchNoticeList(): Promise<NoticeListItem[]> {
    const response
        = await axios.get<NoticeListItem[]>(`${API_BASE_URL}/notices`)
    return response.data
}

export async function fetchNoticeDetail(id: string): Promise<NoticeDetail> {
    const response
        = await axios.get<NoticeDetail>(`${API_BASE_URL}/notices/${id}`)
    return response.data
}