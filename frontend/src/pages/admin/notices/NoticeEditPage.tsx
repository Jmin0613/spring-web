import { type FormEvent, useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import SiteHeader from '../../../components/SiteHeader.tsx'
import { fetchNoticeDetail, updateNotice } from '../../../api/noticeApi.ts'
import './NoticeFormPage.css'

const API_BASE_URL = 'http://localhost:8080'

// 관리자인지 아닌지 확인용도
type MemberInfo = {
    id: number
    loginId?: string
    name?: string
    nickname?: string
    role?: 'ADMIN' | 'USER'
}

// 에러 메시지 꺼내기
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

    return '공지 수정에 실패했습니다.'
}

export default function NoticeEditPage() {
    const { id } = useParams()
    // url에서 수정할 공지 id 가져오기

    const navigate = useNavigate()
    // 수정 성공 후 상세 페이지로 이동할 때 사용

    const [checkingAdmin, setCheckingAdmin] = useState(true)
    // 관리자 권한 확인 중인지 관리

    const [isAdmin, setIsAdmin] = useState(false)
    // 관리자 여부

    const [loading, setLoading] = useState(true)
    // 기존 공지 데이터를 불러오는 중인지 관리

    const [submitting, setSubmitting] = useState(false)
    // 수정 요청 중인지 관리. 중복 클릭 방지용.

    const [title, setTitle] = useState('')
    // 수정할 공지 제목

    const [content, setContent] = useState('')
    // 수정할 공지 내용

    // 관리자 권한 확인
    useEffect(() => {
        async function checkAdmin() {
            try {
                const response = await axios.get<MemberInfo | null>(
                    `${API_BASE_URL}/member/myinfo`,
                    {
                        withCredentials: true,
                    },
                )

                setIsAdmin(response.data?.role === 'ADMIN')
            } catch (error) {
                setIsAdmin(false)
            } finally {
                setCheckingAdmin(false)
            }
        }

        void checkAdmin()
    }, [])

    // 기존 공지 정보 불러오기
    useEffect(() => {
        async function loadNotice() {
            if (!id) {
                alert('잘못된 접근입니다.')
                navigate('/notices')
                return
            }

            try {
                const notice = await fetchNoticeDetail(id)

                setTitle(notice.title)
                setContent(notice.content)
            } catch (error) {
                alert('공지 정보를 불러오지 못했습니다.')
                navigate('/notices')
            } finally {
                setLoading(false)
            }
        }

        void loadNotice()
    }, [id, navigate])

    // 공지 수정
    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (!id) {
            alert('수정할 공지 정보가 없습니다.')
            return
        }

        if (!title.trim()) {
            alert('공지 제목을 입력해주세요.')
            return
        }

        if (!content.trim()) {
            alert('공지 내용을 입력해주세요.')
            return
        }

        try {
            setSubmitting(true)

            await updateNotice(id, {
                title,
                content,
            })

            alert('공지사항이 수정되었습니다.')
            navigate(`/notices/${id}`)
        } catch (error) {
            alert(getErrorMessage(error))
        } finally {
            setSubmitting(false)
        }
    }

    if (checkingAdmin || loading) {
        return (
            <div className="notice-form-page">
                <SiteHeader />
                <main className="notice-form-container">
                    <div className="notice-form-state-box">
                        공지 정보를 불러오는 중입니다...
                    </div>
                </main>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="notice-form-page">
                <SiteHeader />
                <main className="notice-form-container">
                    <div className="notice-form-state-box">
                        관리자만 공지사항을 수정할 수 있습니다.
                    </div>

                    <div className="notice-form-button-row">
                        <button
                            type="button"
                            className="notice-form-secondary-button"
                            onClick={() => navigate('/notices')}
                        >
                            공지목록으로 돌아가기
                        </button>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="notice-form-page">
            <SiteHeader />

            <main className="notice-form-container">
                <section className="notice-form-header">
                    <p className="notice-form-eyebrow">ADMIN NOTICE</p>
                    <h1 className="notice-form-title">공지사항 수정</h1>
                    <p className="notice-form-description">
                        공지 제목과 내용을 수정할 수 있습니다.
                    </p>
                </section>

                <form className="notice-form-card" onSubmit={handleSubmit}>
                    <div className="notice-form-row">
                        <label className="notice-form-label">제목</label>

                        <div className="notice-form-field">
                            <input
                                className="notice-form-input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="공지 제목을 입력해주세요."
                                maxLength={100}
                            />
                        </div>
                    </div>

                    <div className="notice-form-row notice-form-row--content">
                        <label className="notice-form-label">내용</label>

                        <div className="notice-form-field">
                            <textarea
                                className="notice-form-textarea"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="공지 내용을 입력해주세요."
                            />
                        </div>
                    </div>

                    <div className="notice-form-button-row notice-form-button-row--right">
                        <button
                            type="button"
                            className="notice-form-secondary-button"
                            onClick={() => navigate(`/notices/${id}`)}
                        >
                            취소
                        </button>

                        <button
                            type="submit"
                            className="notice-form-primary-button"
                            disabled={submitting}
                        >
                            {submitting ? '수정 중...' : '수정'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    )
}