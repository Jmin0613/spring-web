import { type FormEvent, useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../../components/SiteHeader.tsx'
import './MyPage.css'

const API_BASE_URL = 'http://localhost:8080'

type MemberInfo = {
    id: number
    loginId: string
    email: string | null
    name: string
    nickName: string | null
    phoneNumber: string | null
    role?: string
}

function getErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data

        if (typeof data === 'string') {
            return data
        }

        if (data && typeof data === 'object' && 'message' in data) {
            return String((data as { message?: string }).message)
        }
    }

    return '요청 처리 중 오류가 발생했습니다.'
}

export default function MyPagePasswordCheck() {
    const navigate = useNavigate()

    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null)
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        async function loadMyInfo() {
            try {
                setLoading(true)

                const response = await axios.get<MemberInfo>(`${API_BASE_URL}/mypage/myinfo`, {
                    withCredentials: true,
                })

                setMemberInfo(response.data)
            } catch (error) {
                alert(getErrorMessage(error))
                navigate('/login')
            } finally {
                setLoading(false)
            }
        }

        void loadMyInfo()
    }, [navigate])

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (!password.trim()) {
            alert('비밀번호를 입력해주세요.')
            return
        }

        try {
            setSubmitting(true)

            await axios.post(
                `${API_BASE_URL}/mypage/password-check`,
                {
                    currentPassword: password,
                },
                {
                    withCredentials: true,
                },
            )

            navigate('/mypage/edit-myinfo')
        } catch (error) {
            alert(getErrorMessage(error))
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="mypage">
                <SiteHeader />
                <main className="mypage__content">
                    <div className="mypage__state-box">회원정보를 불러오는 중입니다...</div>
                </main>
            </div>
        )
    }

    if (!memberInfo) {
        return (
            <div className="mypage">
                <SiteHeader />
                <main className="mypage__content">
                    <div className="mypage__state-box">회원정보를 불러오지 못했습니다.</div>
                </main>
            </div>
        )
    }

    return (
        <div className="mypage">
            <SiteHeader />

            <main className="mypage__content">
                <section className="mypage__header">
                    <p className="mypage__eyebrow">SECURITY CHECK</p>
                    <h1 className="mypage__title">계정 보호를 위해 본인 인증이 필요합니다</h1>
                    <p className="mypage__description">
                        회원정보 수정을 위해 현재 비밀번호를 입력해주세요.
                    </p>
                </section>

                <section className="mypage-auth-card">
                    <form
                        className="mypage-auth-form"
                        onSubmit={handleSubmit}
                        autoComplete="off"
                    >
                        <div className="mypage-form-row">
                            <label className="mypage-form-row__label">아이디</label>
                            <div className="mypage-form-row__field">
                                <input
                                    className="mypage-input mypage-input--readonly"
                                    value={memberInfo.loginId}
                                    readOnly
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="mypage-form-row">
                            <label className="mypage-form-row__label">비밀번호</label>
                            <div className="mypage-form-row__field">
                                <input
                                    className="mypage-input"
                                    type="password"
                                    name="mypageVerifyPassword"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="현재 비밀번호를 입력해주세요"
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <div className="mypage-button-row">
                            <button
                                className="mypage-primary-button"
                                type="submit"
                                disabled={submitting}
                            >
                                {submitting ? '확인 중...' : '확인'}
                            </button>

                            <button
                                className="mypage-secondary-button"
                                type="button"
                                onClick={() => navigate('/mypage')}
                            >
                                취소
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    )
}