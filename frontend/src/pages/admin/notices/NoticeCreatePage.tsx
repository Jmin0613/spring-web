import { type FormEvent, useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../../../components/SiteHeader.tsx'
import { createNotice } from '../../../api/noticeApi.ts'
import './NoticeFormPage.css'

const API_BASE_URL = 'http://localhost:8080'

type MemberInfo = {
    id: number
    role?: 'USER' | 'ADMIN'
}

function getErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data

        if (typeof data === 'string' && data.trim()) {
            return data
        }

        if (
            data &&
            typeof data === 'object' &&
            'message' in data &&
            typeof data.message === 'string'
        ) {
            return data.message
        }
    }

    return '공지 등록에 실패했습니다.'
}

export default function NoticeCreatePage() {
    const navigate = useNavigate()

    const [checkingAdmin, setCheckingAdmin] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')

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

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()

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

            const noticeId = await createNotice({
                title,
                content,
            })

            alert('공지사항이 등록되었습니다.')
            navigate(`/notices/${noticeId}`)
        } catch (error) {
            alert(getErrorMessage(error))
        } finally {
            setSubmitting(false)
        }
    }

    if (checkingAdmin) {
        return (
            <div className="notice-form-page">
                <SiteHeader />
                <main className="notice-form-container">
                    <div className="notice-form-state-box">
                        관리자 권한을 확인하는 중입니다...
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
                        관리자만 공지사항을 작성할 수 있습니다.
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
                    <h1 className="notice-form-title">공지사항 작성</h1>
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
                            onClick={() => navigate('/notices')}
                        >
                            취소
                        </button>

                        <button
                            type="submit"
                            className="notice-form-primary-button"
                            disabled={submitting}
                        >
                            {submitting ? '등록 중...' : '등록'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    )
}