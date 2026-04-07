import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchNoticeList } from '../api/noticeApi'
import type { NoticeListItem } from '../types/notice'
import './NoticeListPage.css'

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

export default function NoticeListPage() {
    const [notices, setNotices] = useState<NoticeListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchKeyword, setSearchKeyword] = useState('')

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

    const filteredNotices = useMemo(() => {
        const trimmedKeyword = searchKeyword.trim().toLowerCase()

        if (!trimmedKeyword) {
            return notices
        }

        return notices.filter((notice) =>
            notice.title.toLowerCase().includes(trimmedKeyword),
        )
    }, [notices, searchKeyword])

    if (loading) {
        return (
            <div className="notice-page">
                <div className="notice-container">
                    <p className="notice-state-text">공지 목록을 불러오는 중입니다...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="notice-page">
                <div className="notice-container">
                    <p className="notice-state-text">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="notice-page">
            <div className="notice-container">
                <header className="notice-header">
                    <p className="notice-header-badge">NOTICE</p>
                    <h1 className="notice-title">공지사항</h1>
                    <p className="notice-description">
                        쇼핑몰 이용 안내와 주요 업데이트 소식을 확인해보세요.
                    </p>
                </header>

                <section className="notice-toolbar">
                    <div className="notice-toolbar-left">
            <span className="notice-count">
              총 <strong>{filteredNotices.length}</strong>건
            </span>
                    </div>

                    <div className="notice-search-box">
                        <input
                            type="text"
                            placeholder="공지 제목을 검색해보세요"
                            value={searchKeyword}
                            onChange={(event) => setSearchKeyword(event.target.value)}
                            className="notice-search-input"
                        />
                    </div>
                </section>

                <section className="notice-list-section">
                    <div className="notice-list-head">
                        <span className="notice-list-head-title">제목</span>
                        <span className="notice-list-head-date">작성일</span>
                    </div>

                    {filteredNotices.length === 0 ? (
                        <div className="notice-empty-box">
                            검색 결과에 해당하는 공지가 없습니다.
                        </div>
                    ) : (
                        <ul className="notice-list">
                            {filteredNotices.map((notice) => (
                                <li key={notice.id} className="notice-item">
                                    <Link
                                        to={`/notices/${notice.id}`}
                                        className="notice-item-link"
                                    >
                                        <span className="notice-item-title">{notice.title}</span>
                                        <span className="notice-item-date">
                      {formatDate(notice.createdAt)}
                    </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <div className="notice-pagination">
                    <button type="button" className="notice-page-button is-active">
                        1
                    </button>
                </div>
            </div>
        </div>
    )
}
