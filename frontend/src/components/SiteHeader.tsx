import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useLocation } from 'react-router-dom'

const API_BASE_URL = 'http://localhost:8080'

const topMenus = [
    { label: '베스트', to: '/?menu=best' },
    { label: '공지', to: '/notices' },
    { label: '전체핫딜', to: '/?menu=hotdeal' },
]

type MemberInfo = {
    id: number
    nickname?: string
    name?: string
}

export default function SiteHeader() {
    const location = useLocation()
    const [loginMember, setLoginMember] = useState<MemberInfo | null>(null)

    useEffect(() => {
        async function loadMyInfo() {
            try {
                const response = await axios.get(`${API_BASE_URL}/members/myinfo`, {
                    withCredentials: true,
                })
                setLoginMember(response.data)
            } catch (error) {
                setLoginMember(null)
            }
        }

        void loadMyInfo()
    }, [])

    return (
        <header style={headerStyle}>
            <div style={headerInnerStyle}>
                <div style={leftGroupStyle}>
                    <Link to="/" style={logoStyle}>
                        <span style={logoMainTextStyle}>WAT</span>
                        <span style={logoPercentStyle}>%</span>
                    </Link>

                    <nav style={navStyle}>
                        <Link to="/" style={activeNavLinkStyle}>
                            홈
                        </Link>

                        {topMenus.map((menu) => (
                            <Link key={menu.label} to={menu.to} style={navLinkStyle}>
                                {menu.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div style={rightGroupStyle}>
                    <button style={iconButtonStyle} aria-label="검색">
                        🔍
                    </button>
                    <button style={iconButtonStyle} aria-label="장바구니">
                        🛒
                    </button>
                    <button style={iconButtonStyle} aria-label="배송">
                        🚚
                    </button>

                    {loginMember ? (
                        <Link to="/mypage" style={mypageIconButtonStyle} aria-label="마이페이지">
                            👤
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            state={{
                                from: {
                                    pathname: location.pathname,
                                    search: location.search,
                                    hash: location.hash,
                                },
                            }}
                            style={loginButtonStyle}
                        >
                            로그인
                        </Link>
                    )}
                </div>
            </div>
        </header>
    )
}

const headerStyle = {
    width: '100%',
    borderBottom: '1px solid #ececec',
    backgroundColor: '#ffffff',
} as const

const headerInnerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    height: '88px',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
} as const

const leftGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '28px',
} as const

const logoStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    textDecoration: 'none',
    fontWeight: 900,
    fontSize: '28px',
    letterSpacing: '-0.04em',
} as const

const logoMainTextStyle = {
    color: '#111827',
} as const

const logoPercentStyle = {
    color: '#f59e0b',
} as const

const navStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '22px',
} as const

const navLinkStyle = {
    textDecoration: 'none',
    color: '#111827',
    fontSize: '16px',
    fontWeight: 700,
} as const

const activeNavLinkStyle = {
    textDecoration: 'none',
    color: '#111827',
    fontSize: '16px',
    fontWeight: 800,
    borderBottom: '3px solid #111827',
    paddingBottom: '6px',
} as const

const rightGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
} as const

const iconButtonStyle = {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '24px',
    cursor: 'pointer',
} as const

const loginButtonStyle = {
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    color: '#111827',
    borderRadius: '12px',
    padding: '12px 18px',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
} as const

const mypageIconButtonStyle = {
    width: '46px',
    height: '46px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    color: '#111827',
    borderRadius: '999px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    cursor: 'pointer',
    textDecoration: 'none',
} as const