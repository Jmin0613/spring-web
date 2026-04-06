// 공지 목록 페이지
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchNoticeList } from '../api/noticeApi'
import type { NoticeListItem } from '../types/notice'

export default function NoticeListPage() {
    const [notices, setNotices] = useState<NoticeListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function loadNotices() {
            try {
                const data = await fetchNoticeList()
                setNotices(data)
            } catch (err) {
                setError('공지 목록을 불러오지 못했습니다.')
            } finally {
                setLoading(false)
            }
        }

        loadNotices()
    }, [])

    if (loading) {
        return <div style={{ padding: '20px' }}>로딩 중입니다...</div>
    }

    if (error) {
        return <div style={{ padding: '20px' }}>{error}</div>
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>공지 목록</h1>

            {notices.length === 0 ? (
                <p>등록된 공지가 없습니다.</p>
            ) : (
                <ul>
                    {notices.map((notice) => (
                        <li key={notice.id}>
                            <Link to={`/notices/${notice.id}`}>{notice.title}</Link>
                            <div>{notice.createdAt}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}