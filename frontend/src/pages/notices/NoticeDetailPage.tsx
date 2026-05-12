import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteNotice, fetchNoticeDetail } from '../../api/noticeApi.ts'
import type { NoticeDetail } from '../../types/notice.ts'
import './NoticeDetailPage.css'
import SiteHeader from "../../components/SiteHeader.tsx";

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

function getErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
        const responseData = error.response?.data

        if (typeof responseData === 'string' && responseData.trim()) {
            return responseData
        }

        if (
            responseData &&
            typeof responseData === 'object' &&
            'message' in responseData &&
            typeof responseData.message === 'string'
        ) {
            return responseData.message
        }
    }

    return '요청 처리 중 오류가 발생했습니다.'
}

export default function NoticeDetailPage() {
    const { id } = useParams()

    const navigate = useNavigate()

    const [notice, setNotice] = useState<NoticeDetail | null>(null)

    const [loading, setLoading] = useState(true)

    const [error, setError] = useState('')

    const [loginMember, setLoginMember] = useState<MemberInfo | null>(null)

    const [deleting, setDeleting] = useState(false)

    const isAdmin = loginMember?.role === 'ADMIN'

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

        void loadNoticeDetail()
    }, [id])

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

    const updatedDateText = useMemo(() => {
        if (!notice?.updatedAt) {
            return '-'
        }

        return formatDate(notice.updatedAt)
    }, [notice])

    async function handleDeleteNotice() {
        if (!id) {
            alert('삭제할 공지 정보가 없습니다.')
            return
        }

        const confirmed = window.confirm('공지사항을 삭제할까요?')

        if (!confirmed) {
            return
        }

        try {
            setDeleting(true)

            await deleteNotice(id)

            alert('공지사항이 삭제되었습니다.')
            navigate('/notices')
        } catch (error) {
            alert(getErrorMessage(error))
        } finally {
            setDeleting(false)
        }
    }

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

                {isAdmin && (
                    <div className="notice-detail-admin-actions notice-detail-admin-actions--bottom">
                        <button
                            type="button"
                            className="notice-detail-admin-button"
                            onClick={() => navigate(`/admin/notices/${id}/edit`)}
                        >
                            수정
                        </button>

                        <button
                            type="button"
                            className="notice-detail-admin-button notice-detail-admin-button--danger"
                            onClick={handleDeleteNotice}
                            disabled={deleting}
                        >
                            {deleting ? '삭제 중...' : '삭제'}
                        </button>
                    </div>
                )}

                <div className="notice-detail-bottom">
                    <Link to="/notices" className="notice-detail-back-button">
                        목록
                    </Link>
                </div>
            </div>
        </div>
    )
}