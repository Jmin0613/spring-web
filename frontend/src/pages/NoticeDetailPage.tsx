import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchNoticeDetail } from '../api/noticeApi'
import type { NoticeDetail } from '../types/notice'
import './NoticeDetailPage.css'
import SiteHeader from "../components/SiteHeader.tsx";

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
    // url에서 공지 id 가져옴
    const [notice, setNotice] = useState<NoticeDetail | null>(null)
    // 서버에서 받아온 실제 공지 상세 데이터를 담음
    const [loading, setLoading] = useState(true)
    // 현재 데이터인 공지 상세 데이터를 가져오는 중(true)인지, 아니면 완료(false)되었는지 나타냄
    const [error, setError] = useState('')
    // 데이터를 가져오다가 문제가 생겼을 때의 메세지를 담음

    // 공지 상세 불러오기
    useEffect(() => {
        async function loadNoticeDetail() {
            if (!id) { //확인하려는 공지id가 없다면
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

    // 공지 수정일을 화면에 표시
    const updatedDateText = useMemo(() => {
        if (!notice?.updatedAt) { //공지notice 데이터가 없거나, 있더라도 수정날짜가 비어있는 경우
            return '-'
        }

        return formatDate(notice.updatedAt) //데이터 있다면, formatDate실행
    }, [notice]) //공지데이터가 들어올때 (공지글 쓸때)

    if (loading) {
        return (
            <div className="notice-detail-page">
                <SiteHeader />
                <div className="notice-detail-container">
                    <p className="notice-detail-state-text">공지 상세를 불러오는 중입니다...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="notice-detail-page">
                <SiteHeader />
                <div className="notice-detail-container">
                    <p className="notice-detail-state-text">{error}</p>
                </div>
            </div>
        )
    }

    if (!notice) {
        return (
            <div className="notice-detail-page">
                <SiteHeader />
                <div className="notice-detail-container">
                    <p className="notice-detail-state-text">공지 정보를 찾을 수 없습니다.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="notice-detail-page">
            <SiteHeader />
            <div className="notice-detail-container">
                <header className="notice-detail-header">
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
