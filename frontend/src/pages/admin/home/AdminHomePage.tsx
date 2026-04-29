import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../../../components/SiteHeader.tsx'
import './AdminHomePage.css'

const API_BASE_URL = 'http://localhost:8080'

// 관리자인지 아닌지 확인용도
type MemberInfo = {
    id: number
    loginId?: string
    name?: string
    nickname?: string
    role?: 'ADMIN' | 'USER'
}

type AdminMenuItem = {
    title: string
    description: string
    path: string
    icon: string
}

const adminMenus: AdminMenuItem[] = [
    {
        title: '주문관리',
        description: '들어온 주문을 확인하고 배송 상태를 변경합니다.',
        path: '/admin/orders',
        icon: '📦',
    },
    {
        title: '문의답변',
        description: '사용자가 남긴 상품문의를 확인하고 답변합니다.',
        path: '/admin/inquiries',
        icon: '💬',
    },
    {
        title: '핫딜관리',
        description: '일반 상품을 기반으로 핫딜 상품을 등록합니다.',
        path: '/admin/hotdeals',
        icon: '🔥',
    },
    {
        title: '상품관리',
        description: '일반 상품을 등록, 수정, 삭제하고 상태를 관리합니다.',
        path: '/admin/products',
        icon: '🛍️',
    },
]

export default function AdminHomePage() {
    const navigate = useNavigate()

    const [checkingAdmin, setCheckingAdmin] = useState(true)
    // 관리자 권한 확인 중인지 관리

    const [loginMember, setLoginMember] = useState<MemberInfo | null>(null)
    // 현재 로그인한 회원 정보 저장

    const isAdmin = loginMember?.role === 'ADMIN'
    // 관리자 여부

    // 관리자 권한 확인
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
            } finally {
                setCheckingAdmin(false)
            }
        }

        void loadMyInfo()
    }, [])

    if (checkingAdmin) {
        return (
            <div className="admin-home-page">
                <SiteHeader />
                <main className="admin-home-container">
                    <div className="admin-home-state-box">
                        관리자 권한을 확인하는 중입니다...
                    </div>
                </main>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="admin-home-page">
                <SiteHeader />
                <main className="admin-home-container">
                    <div className="admin-home-state-box">
                        관리자만 접근할 수 있는 페이지입니다.
                    </div>

                    <div className="admin-home-button-row">
                        <button
                            type="button"
                            className="admin-home-secondary-button"
                            onClick={() => navigate('/')}
                        >
                            홈으로 돌아가기
                        </button>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="admin-home-page">
            <SiteHeader />

            <main className="admin-home-container">
                <section className="admin-home-header">
                    <p className="admin-home-eyebrow">ADMIN PAGE</p>
                    <h1 className="admin-home-title">관리자 페이지</h1>
                    <p className="admin-home-description">
                        주문, 문의, 상품, 핫딜을 관리할 수 있습니다.
                    </p>
                </section>

                <section className="admin-home-profile-card">
                    <div className="admin-home-profile-icon">
                        🛠️
                    </div>

                    <div className="admin-home-profile-info">
                        <p className="admin-home-profile-label">관리자 계정</p>
                        <h2>{loginMember?.nickname ?? loginMember?.name ?? '관리자'}</h2>
                        <p>관리자 전용 기능을 사용할 수 있습니다.</p>
                    </div>
                </section>

                <section className="admin-home-menu-grid">
                    {adminMenus.map((menu) => (
                        <button
                            key={menu.path}
                            type="button"
                            className="admin-home-menu-card"
                            onClick={() => navigate(menu.path)}
                        >
                            <div className="admin-home-menu-icon">
                                {menu.icon}
                            </div>

                            <div className="admin-home-menu-text">
                                <h3>{menu.title}</h3>
                                <p>{menu.description}</p>
                            </div>

                            <span className="admin-home-menu-arrow">
                                →
                            </span>
                        </button>
                    ))}
                </section>
            </main>
        </div>
    )
}