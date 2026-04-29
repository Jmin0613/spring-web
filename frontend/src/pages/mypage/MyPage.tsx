import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
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

function getDisplayValue(value?: string | null) {
    if (!value || value.trim() === '') {
        return '-'
    }

    return value
}

export default function MyPage() {
    const navigate = useNavigate()

    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null)
    const [loading, setLoading] = useState(true)

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
                    <p className="mypage__eyebrow">MY PAGE</p>
                    <h1 className="mypage__title">마이페이지</h1>
                </section>

                <section className="mypage-profile-card">
                    <div className="mypage-profile-card__body">
                        <div className="mypage-profile-avatar">
                            <span>👤</span>
                        </div>

                        <div className="mypage-profile-info">
                            <div className="mypage-profile-info__row">
                                <span className="mypage-profile-info__label">아이디</span>
                                <strong>{memberInfo.loginId}</strong>
                            </div>

                            <div className="mypage-profile-info__row">
                                <span className="mypage-profile-info__label">이름</span>
                                <strong>{memberInfo.name}</strong>
                            </div>

                            <div className="mypage-profile-info__row">
                                <span className="mypage-profile-info__label">닉네임</span>
                                <strong>{getDisplayValue(memberInfo.nickName)}</strong>
                            </div>

                            <div className="mypage-profile-info__row">
                                <span className="mypage-profile-info__label">이메일</span>
                                <strong>{getDisplayValue(memberInfo.email)}</strong>
                            </div>

                            <div className="mypage-profile-info__row">
                                <span className="mypage-profile-info__label">폰번호</span>
                                <strong>{getDisplayValue(memberInfo.phoneNumber)}</strong>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="mypage-primary-button"
                        onClick={() => navigate('/mypage/password-check')}
                    >
                        내 정보 변경
                    </button>
                </section>

                <section className="mypage-menu-card">
                    <Link className="mypage-menu-item" to="/mypage/inquiries">
                        <span className="mypage-menu-item__icon">✏️</span>
                        <strong>문의내역</strong>
                    </Link>

                    <Link className="mypage-menu-item" to="/mypage/reviews">
                        <span className="mypage-menu-item__icon">👍</span>
                        <strong>리뷰내역</strong>
                    </Link>

                    <Link className="mypage-menu-item" to="/mypage/orders">
                        <span className="mypage-menu-item__icon">📦</span>
                        <strong>주문내역</strong>
                    </Link>

                    <Link className="mypage-menu-item" to="/wishlist">
                        <span className="mypage-menu-item__icon">💙</span>
                        <strong>찜한 상품</strong>
                    </Link>
                </section>
            </main>
        </div>
    )
}