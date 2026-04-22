import axios from 'axios'
import type { NoticeDetail, NoticeListItem } from '../types/notice'
// 백엔드에서 올 데이터 모양 미리 정의

const API_BASE_URL = 'http://localhost:8080'
// 돌아가는 백엔드 서버 주소

// 뭐 안넘겨줘도 공지 목록 배열 받아옴
export async function fetchNoticeList(): Promise<NoticeListItem[]> {
    const response
        = await axios.get<NoticeListItem[]>(`${API_BASE_URL}/notices`) //서버에서 get응답 올때까지 기다림
    return response.data
}

// 공지id 넘겨주면 해당하는 공지 상세 받아옴
export async function fetchNoticeDetail(id: string): Promise<NoticeDetail> {
    const response
        = await axios.get<NoticeDetail>(`${API_BASE_URL}/notices/${id}`)
    return response.data
}