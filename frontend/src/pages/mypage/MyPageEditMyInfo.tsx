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

type EditMyInfoForm = {
    nickName: string
    email: string
    phoneNumber: string
    currentPassword: string
    newPassword: string
    newPasswordConfirm: string
}

type EditableProfileField = 'nickName' | 'email' | 'phoneNumber'
type PasswordField = 'currentPassword' | 'newPassword' | 'newPasswordConfirm'

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

function getDisplayValue(value?: string | null) {
    if (!value || value.trim() === '') {
        return ''
    }

    return value
}

export default function MyPageEditMyInfo() {
    const navigate = useNavigate()

    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [activeProfileField, setActiveProfileField] =
        useState<EditableProfileField | null>(null)

    const [passwordReady, setPasswordReady] = useState<Record<PasswordField, boolean>>({
        currentPassword: false,
        newPassword: false,
        newPasswordConfirm: false,
    })

    const [form, setForm] = useState<EditMyInfoForm>({
        nickName: '',
        email: '',
        phoneNumber: '',
        currentPassword: '',
        newPassword: '',
        newPasswordConfirm: '',
    })

    useEffect(() => {
        async function loadEditMyInfo() {
            try {
                setLoading(true)

                const response = await axios.get<MemberInfo>(
                    `${API_BASE_URL}/mypage/edit-myinfo`,
                    {
                        withCredentials: true,
                    },
                )

                setMemberInfo(response.data)
            } catch (error) {
                alert(getErrorMessage(error))
                navigate('/mypage/password-check')
            } finally {
                setLoading(false)
            }
        }

        void loadEditMyInfo()
    }, [navigate])

    function handleChange(field: keyof EditMyInfoForm, value: string) {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    function unlockPasswordInput(field: PasswordField) {
        setPasswordReady((prev) => ({
            ...prev,
            [field]: true,
        }))

        handleChange(field, '')
    }

    function getProfilePlaceholder(field: EditableProfileField) {
        if (!memberInfo) {
            return ''
        }

        if (activeProfileField === field) {
            if (field === 'nickName') return '변경할 닉네임'
            if (field === 'email') return '변경할 이메일'
            return '010-0000-0000'
        }

        if (field === 'nickName') {
            return getDisplayValue(memberInfo.nickName) || '현재 닉네임 없음'
        }

        if (field === 'email') {
            return getDisplayValue(memberInfo.email) || '현재 이메일 없음'
        }

        return getDisplayValue(memberInfo.phoneNumber) || '현재 폰번호 없음'
    }

    function hasAnyInput() {
        return Object.values(form).some((value) => value.trim() !== '')
    }

    function isPasswordChangeRequested() {
        return (
            form.currentPassword.trim() !== '' ||
            form.newPassword.trim() !== '' ||
            form.newPasswordConfirm.trim() !== ''
        )
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (!hasAnyInput()) {
            alert('변경할 정보를 입력해주세요.')
            return
        }

        if (isPasswordChangeRequested()) {
            if (!form.currentPassword.trim()) {
                alert('현재 비밀번호를 입력해주세요.')
                return
            }

            if (!form.newPassword.trim()) {
                alert('새 비밀번호를 입력해주세요.')
                return
            }

            if (!form.newPasswordConfirm.trim()) {
                alert('새 비밀번호 확인을 입력해주세요.')
                return
            }

            if (form.newPassword !== form.newPasswordConfirm) {
                alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.')
                return
            }
        }

        try {
            setSubmitting(true)

            await axios.patch(
                `${API_BASE_URL}/mypage/edit-myinfo`,
                {
                    nickName: form.nickName,
                    email: form.email,
                    phoneNumber: form.phoneNumber,
                    currentPassword: form.currentPassword,
                    newPassword: form.newPassword,
                    newPasswordConfirm: form.newPasswordConfirm,
                },
                {
                    withCredentials: true,
                },
            )

            window.dispatchEvent(new Event('member-info-updated'))

            alert('회원정보가 수정되었습니다.')
            navigate('/mypage')
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
                <section className="mypage-edit-page-header">
                    <div className="mypage-edit-page-header__title">
                        <p className="mypage__eyebrow">EDIT MY INFO</p>
                        <h1 className="mypage__title">회원정보 수정</h1>
                    </div>

                    <span className="mypage-card__badge">인증 완료</span>
                </section>

                <form
                    className="mypage-edit-layout"
                    onSubmit={handleSubmit}
                    autoComplete="off"
                >
                    <section className="mypage-card">
                        <div className="mypage-card__header">
                            <div>
                                <h2 className="mypage-card__title">기본 정보</h2>
                            </div>
                        </div>

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
                            <label className="mypage-form-row__label">이름</label>
                            <div className="mypage-form-row__field">
                                <input
                                    className="mypage-input mypage-input--readonly"
                                    value={memberInfo.name}
                                    readOnly
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="mypage-form-row">
                            <label className="mypage-form-row__label">닉네임</label>
                            <div className="mypage-form-row__field">
                                <input
                                    className="mypage-input"
                                    name="changeNickName"
                                    value={form.nickName}
                                    onFocus={() => setActiveProfileField('nickName')}
                                    onBlur={() => setActiveProfileField(null)}
                                    onChange={(e) => handleChange('nickName', e.target.value)}
                                    placeholder={getProfilePlaceholder('nickName')}
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="mypage-form-row">
                            <label className="mypage-form-row__label">이메일</label>
                            <div className="mypage-form-row__field">
                                <input
                                    className="mypage-input"
                                    type="email"
                                    name="changeEmail"
                                    value={form.email}
                                    onFocus={() => setActiveProfileField('email')}
                                    onBlur={() => setActiveProfileField(null)}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder={getProfilePlaceholder('email')}
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="mypage-form-row">
                            <label className="mypage-form-row__label">폰번호</label>
                            <div className="mypage-form-row__field">
                                <input
                                    className="mypage-input"
                                    name="changePhoneNumber"
                                    value={form.phoneNumber}
                                    onFocus={() => setActiveProfileField('phoneNumber')}
                                    onBlur={() => setActiveProfileField(null)}
                                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                                    placeholder={getProfilePlaceholder('phoneNumber')}
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="mypage-card">
                        <div className="mypage-card__header">
                            <div>
                                <h2 className="mypage-card__title">비밀번호</h2>
                            </div>
                        </div>

                        <div className="mypage-form-row">
                            <label className="mypage-form-row__label">현재 비밀번호</label>
                            <div className="mypage-form-row__field">
                                <input
                                    className="mypage-input"
                                    type="password"
                                    name="editMyInfoCurrentPassword"
                                    value={form.currentPassword}
                                    onFocus={() => unlockPasswordInput('currentPassword')}
                                    onChange={(e) =>
                                        handleChange('currentPassword', e.target.value)
                                    }
                                    placeholder="현재 비밀번호"
                                    autoComplete="new-password"
                                    readOnly={!passwordReady.currentPassword}
                                />
                            </div>
                        </div>

                        <div className="mypage-form-row">
                            <label className="mypage-form-row__label">새 비밀번호</label>
                            <div className="mypage-form-row__field">
                                <input
                                    className="mypage-input"
                                    type="password"
                                    name="editMyInfoNewPassword"
                                    value={form.newPassword}
                                    onFocus={() => unlockPasswordInput('newPassword')}
                                    onChange={(e) => handleChange('newPassword', e.target.value)}
                                    placeholder="새 비밀번호"
                                    autoComplete="new-password"
                                    readOnly={!passwordReady.newPassword}
                                />
                                <p className="mypage-help-text">
                                    12자 이상, 대문자/소문자/숫자/특수문자를 포함해야 합니다.
                                </p>
                            </div>
                        </div>

                        <div className="mypage-form-row">
                            <label className="mypage-form-row__label">새 비밀번호 확인</label>
                            <div className="mypage-form-row__field">
                                <input
                                    className="mypage-input"
                                    type="password"
                                    name="editMyInfoNewPasswordConfirm"
                                    value={form.newPasswordConfirm}
                                    onFocus={() => unlockPasswordInput('newPasswordConfirm')}
                                    onChange={(e) =>
                                        handleChange('newPasswordConfirm', e.target.value)
                                    }
                                    placeholder="새 비밀번호 확인"
                                    autoComplete="new-password"
                                    readOnly={!passwordReady.newPasswordConfirm}
                                />
                            </div>
                        </div>
                    </section>

                    <div className="mypage-button-row mypage-button-row--right">
                        <button
                            className="mypage-secondary-button"
                            type="button"
                            onClick={() => navigate('/mypage')}
                        >
                            취소
                        </button>

                        <button
                            className="mypage-primary-button"
                            type="submit"
                            disabled={submitting}
                        >
                            {submitting ? '저장 중...' : '변경사항 저장'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    )
}