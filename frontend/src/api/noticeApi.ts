import axios from 'axios'
import type { NoticeDetail, NoticeListItem } from '../types/notice'
// 백엔드에서 올 데이터 모양 미리 정의

const API_BASE_URL = 'http://localhost:8080'
// 돌아가는 백엔드 서버 주소

export type NoticeFormRequest = {
    title: string
    content: string
}

// 뭐 안넘겨줘도 공지 목록 배열 받아옴
export async function fetchNoticeList(): Promise<NoticeListItem[]> {
    // axios.get<NoticeListItem[]>() 때문에 반환 타입 추론 가능
    // Promise<NoticeListItem[]>은 명시해두지 않아도 되긴 함. 어캐보면 중복코드 느낌.
    const response
        = await axios.get<NoticeListItem[]>(`${API_BASE_URL}/notices`) //서버에서 get응답 올때까지 기다림
    return response.data
}

// 공지id 넘겨주면 해당하는 공지 상세 받아옴
export async function fetchNoticeDetail(noticeId: string | number): Promise<NoticeDetail> {
    const response
        = await axios.get<NoticeDetail>(`${API_BASE_URL}/notices/${noticeId}`)
    return response.data
}

// (관리자) 공지 생성
export async function createNotice(request: NoticeFormRequest) : Promise<number> {
    const response = await axios.post<number>(
        `${API_BASE_URL}/admin/notice`,
        request,
        {
            withCredentials : true,
            // withCredentials: true
            // 프론트엔드와 백엔드가 서로 다른 도멘인이나 포트에 있을떄,
            // 브라우저가 요청에 쿠키나 인증헤더를 자동으로 포함해서 보내도록 설정
            // -> 관리자 권한 확인용
        },
    )
    return response.data
}

// (관리자) 공지 수정
export async function updateNotice(noticeId: string | number, request: NoticeFormRequest,) : Promise<void> {
    await axios.patch(
        `${API_BASE_URL}/admin/notices/${noticeId}`,
        request,
        {
            withCredentials : true,
        },
    )
}

// (관리자) 공지 삭제
export async function deleteNotice(noticeId: string | number) {
    await axios.delete(`${API_BASE_URL}/admin/notices/${noticeId}`, {
        withCredentials : true,
    })
}