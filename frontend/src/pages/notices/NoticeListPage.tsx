import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { fetchNoticeList } from '../../api/noticeApi.ts'
import type { NoticeListItem } from '../../types/notice.ts'
import './NoticeListPage.css'
import SiteHeader from '../../components/SiteHeader.tsx'

const API_BASE_URL = '/api'

type MemberInfo = {
    id: number
    loginId?: string
    name?: string
    nickname?: string
    role?: 'ADMIN' | 'USER'
}

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

    const [loginMember, setLoginMember] = useState<MemberInfo | null>(null)

    const isAdmin = loginMember?.role === 'ADMIN'

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

        void loadNotices()
    }, [])

    useEffect(() => {
        async function loadMyInfo() {
            try {
                const response = await axios.get<MemberInfo | null>(
                    `${API_BASE_URL}/member/myinfo`,
                    {
                        withCredentials: true,
                    },
                )

                setLoginMember(response.data ?? null)
            } catch (error) {
                setLoginMember(null)
            }
        }

        void loadMyInfo()
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
                <SiteHeader />
                <main className="notice-container">
                    <div className="notice-state-text">공지 목록을 불러오는 중입니다...</div>
                </main>
            </div>
        )
    }

    if (error) {
        return (
            <div className="notice-page">
                <SiteHeader />
                <main className="notice-container">
                    <div className="notice-state-text">{error}</div>
                </main>
            </div>
        )
    }

    return (
        <div className="notice-page">
            <SiteHeader />

            <main className="notice-container">
                <section className="notice-header">
                    <p className="notice-header-badge">NOTICE</p>
                    <h1 className="notice-title">공지사항</h1>
                    <p className="notice-description">
                        쇼핑몰 이용 안내와 주요 업데이트 소식을 확인해보세요.
                    </p>
                </section>

                <section className="notice-toolbar">
                    <div className="notice-count">
                        총 <strong>{filteredNotices.length}</strong>건
                    </div>

                    <div className="notice-toolbar-right">
                        <div className="notice-search-box">
                            <input
                                value={searchKeyword}
                                onChange={(event) => setSearchKeyword(event.target.value)}
                                className="notice-search-input"
                                placeholder="공지 제목 검색"
                            />
                        </div>
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
                                <li className="notice-item" key={notice.id}>
                                    <Link
                                        to={`/notices/${notice.id}`}
                                        className="notice-item-link"
                                    >
                                        <span className="notice-item-title">
                                            {notice.title}
                                        </span>
                                        <span className="notice-item-date">
                                            {formatDate(notice.createdAt)}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {isAdmin && (
                    <div className="notice-admin-write-row">
                        <Link className="notice-admin-write-button" to="/admin/notices/new">
                            글쓰기
                        </Link>
                    </div>
                )}

                <div className="notice-pagination">
                    <button className="notice-page-button is-active" type="button">
                        1
                    </button>
                </div>
            </main>
        </div>
    )
}