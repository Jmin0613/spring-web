import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchNoticeDetail } from '../api/noticeApi'
import type { NoticeDetail } from '../types/notice'
import './NoticeDetailPage.css'

function formatDate(dateString: string) {
    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
        return dateString
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}.${month}.${day}`
}

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

    const updatedDateText = useMemo(() => {
        if (!notice?.updatedAt) {
            return '-'
        }

        return formatDate(notice.updatedAt)
    }, [notice])

    if (loading) {
        return (
            <div className="notice-detail-page">
                <div className="notice-detail-container">
                    <p className="notice-detail-state-text">공지 상세를 불러오는 중입니다...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="notice-detail-page">
                <div className="notice-detail-container">
                    <p className="notice-detail-state-text">{error}</p>
                </div>
            </div>
        )
    }

    if (!notice) {
        return (
            <div className="notice-detail-page">
                <div className="notice-detail-container">
                    <p className="notice-detail-state-text">공지 정보를 찾을 수 없습니다.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="notice-detail-page">
            <div className="notice-detail-container">
                <header className="notice-detail-header">
                    <p className="notice-detail-badge">NOTICE</p>
                    <h1 className="notice-detail-title">{notice.title}</h1>

                    <div className="notice-detail-meta">
                        <span>작성일 {formatDate(notice.createdAt)}</span>
                        <span>수정일 {updatedDateText}</span>
                    </div>
                </header>

                <section className="notice-detail-content-box">
                    <div className="notice-detail-content">{notice.content}</div>
                </section>

                <div className="notice-detail-bottom">
                    <Link to="/notices" className="notice-detail-back-button">
                        목록
                    </Link>
                </div>
            </div>
        </div>
    )
}
