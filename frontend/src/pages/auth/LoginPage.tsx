import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5'

import './LoginPage.css'

const API_BASE_URL = 'http://localhost:8080'

type LoginForm = {
    loginId: string
    password: string
}

type LoginRedirectState = {
    from?: {
        pathname?: string
        search?: string
        hash?: string
    }
    redirectState?: unknown
}

function getLoginErrorMessage(error: unknown) {
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

    return '로그인에 실패했습니다.'
}

export default function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()

    const [form, setForm] = useState<LoginForm>({
        loginId: '',
        password: '',
    })

    const [keepLogin, setKeepLogin] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const loginRedirectState = location.state as LoginRedirectState | null
    const fromLocation = loginRedirectState?.from

    const redirectPath = useMemo(() => {
        if (!fromLocation) {
            return '/'
        }

        const pathname = fromLocation.pathname ?? '/'
        const search = fromLocation.search ?? ''
        const hash = fromLocation.hash ?? ''

        const path = `${pathname}${search}${hash}`

        if (path === '/login' || path.startsWith('/login?')) {
            return '/'
        }

        return path
    }, [fromLocation])

    function handleChange(field: keyof LoginForm, value: string) {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (!form.loginId.trim()) {
            setErrorMessage('아이디를 입력해주세요.')
            return
        }

        if (!form.password.trim()) {
            setErrorMessage('비밀번호를 입력해주세요.')
            return
        }

        try {
            setLoading(true)
            setErrorMessage('')

            await axios.post(
                `${API_BASE_URL}/login`,
                {
                    loginId: form.loginId,
                    password: form.password,
                },
                {
                    withCredentials: true,
                },
            )

            const redirectState = location.state?.redirectState

            navigate(redirectPath, {
                replace: true,
                state: redirectState,
            })
        } catch (error) {
            setErrorMessage(getLoginErrorMessage(error))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-page__inner">
                <Link to="/" className="login-page__brand">
                    <span className="login-page__brand-main">WAT</span>
                    <span className="login-page__brand-percent">%</span>
                </Link>

                <p className="login-page__brand-sub">쇼핑몰 메인으로 돌아가기</p>

                <div className="login-card">
                    <p className="login-card__guide">
                        아이디와 비밀번호를 입력해 주세요.
                    </p>

                    <form className="login-form" onSubmit={handleSubmit}>
                        <input
                            className="login-form__input"
                            type="text"
                            placeholder="아이디"
                            value={form.loginId}
                            onChange={(e) => handleChange('loginId', e.target.value)}
                            autoComplete="username"
                        />

                        <div className="login-form__input-wrap">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="login-form__input"
                                value={form.password}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        password: e.target.value,
                                    }))
                                }
                                placeholder="비밀번호"
                            />

                            <button
                                type="button"
                                className="login-form__password-toggle"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                                title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                            >
                                {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                            </button>
                        </div>

                        <label className="login-form__check">
                            <input
                                type="checkbox"
                                checked={keepLogin}
                                onChange={(e) => setKeepLogin(e.target.checked)}
                            />
                            <span>로그인 상태 유지</span>
                        </label>

                        {errorMessage && (
                            <div className="login-form__error">{errorMessage}</div>
                        )}

                        <button
                            className="login-form__submit"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>

                    <div className="login-card__helper">
                        <p className="login-card__helper-text">아직 회원이 아니신가요?</p>

                        <div className="login-card__helper-links">
                            <Link to="/signup" className="login-card__helper-link">
                                회원가입
                            </Link>

                            <span className="login-card__helper-divider">|</span>

                            <button type="button" className="login-card__helper-button">
                                아이디 찾기
                            </button>

                            <span className="login-card__helper-divider">|</span>

                            <button type="button" className="login-card__helper-button">
                                비밀번호 찾기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}