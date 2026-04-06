// 공지 상세 페이지
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchNoticeDetail } from '../api/noticeApi'
import type { NoticeDetail } from '../types/notice'

export default function NoticeDetailPage() {
    const { id } = useParams()
    const [notice, setNotice] = useState<NoticeDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function loadNoticeDetail() {
            if (!id) {
                setError('잘못된 접근입니다.')
                setLoading(false)
                return
            }

            try {
                const data = await fetchNoticeDetail(id)
                setNotice(data)
            } catch (err) {
                setError('공지 상세를 불러오지 못했습니다.')
            } finally {
                setLoading(false)
            }
        }

        loadNoticeDetail()
    }, [id])

    if (loading) {
        return <div style={{ padding: '20px' }}>로딩 중입니다...</div>
    }

    if (error) {
        return <div style={{ padding: '20px' }}>{error}</div>
    }

    if (!notice) {
        return <div style={{ padding: '20px' }}>공지 정보를 찾을 수 없습니다.</div>
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>{notice.title}</h1>
            <p>{notice.content}</p>
            <div>작성일: {notice.createdAt}</div>
            <div>수정일: {notice.updatedAt}</div>

            <div style={{ marginTop: '20px' }}>
                <Link to="/notices">목록으로 돌아가기</Link>
            </div>
        </div>
    )
}