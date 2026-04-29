import { useMemo, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import './SignupPage.css'
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5'

const API_BASE_URL = 'http://localhost:8080'

type LoginIdCheckResponse = {
    available: boolean
    message: string
}

type SignupForm = {
    loginId: string
    password: string
    passwordConfirm: string
    name: string
    nickName: string
    phoneNumber: string
    emailLocal: string
    emailDomain: string
}

// 전화번호 하이픈
function formatPhoneNumber(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)

    if (digits.length <= 3) {
        return digits
    }

    if (digits.length <= 7) {
        return `${digits.slice(0, 3)}-${digits.slice(3)}`
    }

    if (digits.length <= 10) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
    }

    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export default function SignupPage() {
    const navigate = useNavigate()

    const [showPassword, setShowPassword] = useState(false)
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

    const [form, setForm] = useState<SignupForm>({
        loginId: '',
        password: '',
        passwordConfirm: '',
        name: '',
        nickName: '',
        phoneNumber: '',
        emailLocal: '',
        emailDomain: '',
    })

    const [submitLoading, setSubmitLoading] = useState(false)
    const [submitErrorMessage, setSubmitErrorMessage] = useState('')

    const [loginIdCheckLoading, setLoginIdCheckLoading] = useState(false)
    const [loginIdChecked, setLoginIdChecked] = useState(false)
    const [loginIdAvailable, setLoginIdAvailable] = useState(false)
    const [loginIdCheckMessage, setLoginIdCheckMessage] = useState('')

    const email = useMemo(() => {
        const local = form.emailLocal.trim()
        const domain = form.emailDomain.trim()

        if (!local || !domain) {
            return ''
        }

        return `${local}@${domain}`
    }, [form.emailLocal, form.emailDomain])

    const passwordRuleText =
        '대문자, 소문자, 숫자, 특수문자 포함 12자이상'

    const passwordPattern =
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/

    const isPasswordMatched =
        !form.passwordConfirm || form.password === form.passwordConfirm

    const isPasswordValid =
        !form.password || passwordPattern.test(form.password)

    function updateField<K extends keyof SignupForm>(key: K, value: SignupForm[K]) {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }))

        if (key === 'loginId') {
            setLoginIdChecked(false)
            setLoginIdAvailable(false)
            setLoginIdCheckMessage('')
        }

        if (submitErrorMessage) {
            setSubmitErrorMessage('')
        }
    }

    async function handleCheckLoginId() {
        const trimmedLoginId = form.loginId.trim()

        if (!trimmedLoginId) {
            setLoginIdChecked(false)
            setLoginIdAvailable(false)
            setLoginIdCheckMessage('아이디를 입력해주세요.')
            return
        }

        try {
            setLoginIdCheckLoading(true)
            setLoginIdCheckMessage('')

            const response = await axios.get<LoginIdCheckResponse>(
                `${API_BASE_URL}/members/check-login-id`,
                {
                    params: {
                        loginId: trimmedLoginId,
                    },
                },
            )

            setLoginIdChecked(true)
            setLoginIdAvailable(response.data.available)
            setLoginIdCheckMessage(response.data.message)
        } catch (e) {
            setLoginIdChecked(false)
            setLoginIdAvailable(false)
            setLoginIdCheckMessage(getSignupErrorMessage(e))
        } finally {
            setLoginIdCheckLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (!form.loginId.trim()) {
            setSubmitErrorMessage('아이디를 입력해주세요.')
            return
        }

        if (!loginIdChecked || !loginIdAvailable) {
            setSubmitErrorMessage('아이디 중복 확인을 완료해주세요.')
            return
        }

        if (!form.password.trim()) {
            setSubmitErrorMessage('비밀번호를 입력해주세요.')
            return
        }

        if (!form.passwordConfirm.trim()) {
            setSubmitErrorMessage('비밀번호 확인을 입력해주세요.')
            return
        }

        if (form.password !== form.passwordConfirm) {
            setSubmitErrorMessage('비밀번호가 일치하지 않습니다.')
            return
        }

        if (!passwordPattern.test(form.password)) {
            setSubmitErrorMessage('올바른 비밀번호를 입력해주세요.')
            return
        }

        if (!form.name.trim()) {
            setSubmitErrorMessage('이름을 입력해주세요.')
            return
        }

        if (!form.nickName.trim()) {
            setSubmitErrorMessage('닉네임을 입력해주세요.')
            return
        }

        if (!form.phoneNumber.trim()) {
            setSubmitErrorMessage('전화번호를 입력해주세요.')
            return
        }

        if (!form.emailLocal.trim() || !form.emailDomain.trim()) {
            setSubmitErrorMessage('이메일을 입력해주세요.')
            return
        }

        try {
            setSubmitLoading(true)
            setSubmitErrorMessage('')

            await axios.post(`${API_BASE_URL}/members`, {
                loginId: form.loginId.trim(),
                password: form.password,
                email,
                name: form.name.trim(),
                nickName: form.nickName.trim(),
                phoneNumber: form.phoneNumber.trim(),
            })

            alert('회원가입이 완료되었습니다. 로그인해주세요.')
            navigate('/login', { replace: true })
        } catch (e) {
            setSubmitErrorMessage(getSignupErrorMessage(e))
        } finally {
            setSubmitLoading(false)
        }
    }

    return (
        <div className="signup-page">
            <div className="signup-card">
                <div className="signup-card__header">
                    <h1 className="signup-card__title">회원가입</h1>
                    <p className="signup-card__description">
                        회원이 되어 다양한 혜택을 경험해 보세요!
                    </p>
                </div>

                <form className="signup-form" onSubmit={handleSubmit}>
                    <div className="signup-form__field">
                        <div className="signup-form__label-row">
                            <label className="signup-form__label">아이디</label>
                            {loginIdCheckMessage && (
                                <span
                                    className={
                                        loginIdChecked && loginIdAvailable
                                            ? 'signup-form__message signup-form__message--success'
                                            : 'signup-form__message signup-form__message--error'
                                    }
                                >
                                    {loginIdCheckMessage}
                                </span>
                            )}
                        </div>

                        <div className="signup-form__inline-row">
                            <input
                                type="text"
                                className="signup-form__input signup-form__input--with-button"
                                placeholder="아이디 입력 (6~20자)"
                                value={form.loginId}
                                onChange={(e) => updateField('loginId', e.target.value)}
                            />
                            <button
                                type="button"
                                className="signup-form__check-button"
                                onClick={handleCheckLoginId}
                                disabled={loginIdCheckLoading}
                            >
                                {loginIdCheckLoading ? '확인 중...' : '중복 확인'}
                            </button>
                        </div>
                    </div>

                    <div className="signup-form__field">
                        <div className="signup-form__label-row">
                            <label className="signup-form__label">비밀번호</label>
                            {!isPasswordValid && (
                                <span className="signup-form__message signup-form__message--error">
                                    올바른 비밀번호를 입력해주세요.
                                </span>
                            )}
                        </div>
                        <div className="signup-form__input-wrap">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="signup-form__input signup-form__input--password"
                                placeholder={`비밀번호 입력 (${passwordRuleText})`}
                                value={form.password}
                                onChange={(e) => updateField('password', e.target.value)}
                            />

                            <button
                                type="button"
                                className="signup-form__password-toggle"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                                title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                            >
                                {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                            </button>
                        </div>
                    </div>

                    <div className="signup-form__field">
                        <div className="signup-form__label-row">
                            <label className="signup-form__label">비밀번호 확인</label>
                            {!isPasswordMatched && (
                                <span className="signup-form__message signup-form__message--error">
                                    비밀번호가 일치하지 않습니다.
                                </span>
                            )}
                        </div>
                        <div className="signup-form__input-wrap">
                            <input
                                type={showPasswordConfirm ? 'text' : 'password'}
                                className="signup-form__input signup-form__input--password"
                                placeholder="비밀번호 재입력"
                                value={form.passwordConfirm}
                                onChange={(e) => updateField('passwordConfirm', e.target.value)}
                            />

                            <button
                                type="button"
                                className="signup-form__password-toggle"
                                onClick={() => setShowPasswordConfirm((prev) => !prev)}
                                aria-label={showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
                                title={showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
                            >
                                {showPasswordConfirm ? <IoEyeOffOutline /> : <IoEyeOutline />}
                            </button>
                        </div>
                    </div>

                    <div className="signup-form__field">
                        <div className="signup-form__label-row">
                            <label className="signup-form__label">이름</label>
                        </div>
                        <input
                            type="text"
                            className="signup-form__input"
                            placeholder="이름을 입력해주세요."
                            value={form.name}
                            onChange={(e) => updateField('name', e.target.value)}
                        />
                    </div>

                    <div className="signup-form__field">
                        <div className="signup-form__label-row">
                            <label className="signup-form__label">닉네임</label>
                        </div>
                        <input
                            type="text"
                            className="signup-form__input"
                            placeholder="닉네임을 입력해주세요."
                            value={form.nickName}
                            onChange={(e) => updateField('nickName', e.target.value)}
                        />
                    </div>

                    <div className="signup-form__field">
                        <div className="signup-form__label-row">
                            <label className="signup-form__label">전화번호</label>
                        </div>
                        <input
                            type="text"
                            className="signup-form__input"
                            placeholder="휴대폰 번호 입력 (예: 010-1234-5678)"
                            value={form.phoneNumber}
                            onChange={(e) => updateField('phoneNumber', formatPhoneNumber(e.target.value))}
                            // inputMode="numeric"
                            autoComplete="tel"
                            maxLength={13}
                        />
                    </div>

                    <div className="signup-form__field">
                        <div className="signup-form__label-row">
                            <label className="signup-form__label">이메일 주소</label>
                        </div>

                        <div className="signup-form__email-row">
                            <input
                                type="text"
                                className="signup-form__input signup-form__email-input"
                                placeholder="이메일 주소"
                                value={form.emailLocal}
                                onChange={(e) => updateField('emailLocal', e.target.value)}
                            />

                            <span className="signup-form__email-at">@</span>

                            <input
                                type="text"
                                className="signup-form__input signup-form__email-input"
                                placeholder="gmail.com"
                                value={form.emailDomain}
                                onChange={(e) => updateField('emailDomain', e.target.value)}
                            />
                        </div>
                    </div>

                    {submitErrorMessage && (
                        <p className="signup-form__submit-error">{submitErrorMessage}</p>
                    )}

                    <div className="signup-form__button-row">
                        <button
                            type="submit"
                            className="signup-form__submit-button"
                            disabled={submitLoading}
                        >
                            {submitLoading ? '가입 중...' : '가입하기'}
                        </button>

                        <Link to="/login" className="signup-form__cancel-button">
                            가입취소
                        </Link>
                    </div>

                    <div className="signup-form__bottom-link-row">
                        <span className="signup-form__bottom-link-text">
                            이미 계정이 있으신가요?
                        </span>
                        <Link to="/login" className="signup-form__bottom-link">
                            로그인
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}

function getSignupErrorMessage(error: unknown): string {
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

    return '회원가입 처리에 실패했습니다.'
}