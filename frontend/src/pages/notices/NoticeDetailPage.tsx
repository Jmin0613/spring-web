import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteNotice, fetchNoticeDetail } from '../../api/noticeApi.ts'
import type { NoticeDetail } from '../../types/notice.ts'
import './NoticeDetailPage.css'
import SiteHeader from "../../components/SiteHeader.tsx";

const API_BASE_URL = 'http://localhost:8080'

// 관리자인지 아닌지 확인용도
type MemberInfo = {
    id: number
    loginId?: string // 비로그인일 수도 있음
    name?: string
    nickname?: string
    role?: 'ADMIN' | 'USER' // 관리자 OR 일반회원
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

// 삭제 실패 시, 백엔드 예외 메시지를 최대한 꺼내오기
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
    // url에서 공지 id 가져옴

    const navigate = useNavigate()
    // 페이지 이동용. 수정 페이지 이동, 삭제 후 목록 이동에 사용.

    const [notice, setNotice] = useState<NoticeDetail | null>(null)
    // 서버에서 받아온 실제 공지 상세 데이터를 담음

    const [loading, setLoading] = useState(true)
    // 현재 데이터인 공지 상세 데이터를 가져오는 중(true)인지, 아니면 완료(false)되었는지 나타냄

    const [error, setError] = useState('')
    // 데이터를 가져오다가 문제가 생겼을 때의 메세지를 담음

    const [loginMember, setLoginMember] = useState<MemberInfo | null>(null)
    // 현재 로그인한 회원 정보. 관리자 여부 확인용.

    const [deleting, setDeleting] = useState(false)
    // 삭제 요청 중인지 관리. 중복 클릭 방지용.

    const isAdmin = loginMember?.role === 'ADMIN'
    // 관리자라면 수정/삭제 버튼을 보여주기 위해 사용

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

        void loadNoticeDetail()
    }, [id])

    // 관리자인지 아닌지 확인
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

    // 공지 수정일을 화면에 표시
    const updatedDateText = useMemo(() => {
        if (!notice?.updatedAt) { //공지notice 데이터가 없거나, 있더라도 수정날짜가 비어있는 경우
            return '-'
        }

        return formatDate(notice.updatedAt) //데이터 있다면, formatDate실행
    }, [notice]) //공지데이터가 들어올때 (공지글 쓸때)

    // 관리자 공지 삭제
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