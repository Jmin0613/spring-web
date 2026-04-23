import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Link, useLocation, useNavigate } from 'react-router-dom'

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
    const navigate = useNavigate()
    const menuRef = useRef<HTMLDivElement | null>(null)

    const [loginMember, setLoginMember] = useState<MemberInfo | null>(null)
    const [menuOpen, setMenuOpen] = useState(false)

    const displayName =
        loginMember?.nickname ?? loginMember?.name ?? '회원'

    useEffect(() => {
        async function loadMyInfo() {
            try {
                const response = await axios.get<MemberInfo>(
                    `${API_BASE_URL}/members/myinfo`,
                    { withCredentials: true },
                )
                setLoginMember(response.data)
            } catch (error) {
                setLoginMember(null)
            }
        }

        void loadMyInfo()
    }, [location.pathname])

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (!menuRef.current) return
            if (!menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [menuOpen])

    async function handleLogout() {
        try {
            await axios.post(
                `${API_BASE_URL}/logout`,
                {},
                { withCredentials: true },
            )

            setLoginMember(null)
            setMenuOpen(false)
            navigate('/', { replace: true })
        } catch (error) {
            alert('로그아웃에 실패했습니다.')
        }
    }

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
                        <div style={profileMenuWrapStyle} ref={menuRef}>
                            <button
                                type="button"
                                style={profileButtonStyle}
                                onClick={() => setMenuOpen((prev) => !prev)}
                            >
                                <span style={profileAvatarStyle}>👤</span>
                                <span style={profileNameStyle}>{displayName}</span>
                                <span style={profileArrowStyle}>▾</span>
                            </button>

                            {menuOpen && (
                                <div style={dropdownMenuStyle}>
                                    <Link
                                        to="/mypage"
                                        style={dropdownItemLinkStyle}
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        마이페이지
                                    </Link>

                                    <Link
                                        to="/wishlist"
                                        style={dropdownItemLinkStyle}
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        찜한 상품
                                    </Link>

                                    <Link
                                        to="/orders"
                                        style={dropdownItemLinkStyle}
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        주문 목록
                                    </Link>

                                    <div style={dropdownDividerStyle} />

                                    <button
                                        type="button"
                                        style={dropdownLogoutButtonStyle}
                                        onClick={handleLogout}
                                    >
                                        로그아웃
                                    </button>
                                </div>
                            )}
                        </div>
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

const profileMenuWrapStyle = {
    position: 'relative',
} as const

const profileButtonStyle = {
    minWidth: '118px',
    height: '46px',
    border: '1px solid #111827',
    backgroundColor: '#ffffff',
    color: '#111827',
    borderRadius: '8px',
    padding: '0 12px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
} as const

const profileAvatarStyle = {
    width: '26px',
    height: '26px',
    borderRadius: '999px',
    backgroundColor: '#9ca3af',
    color: '#ffffff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    flexShrink: 0,
} as const

const profileNameStyle = {
    fontSize: '15px',
    fontWeight: 700,
    maxWidth: '60px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
} as const

const profileArrowStyle = {
    fontSize: '12px',
    color: '#374151',
} as const

const dropdownMenuStyle = {
    position: 'absolute',
    top: '56px',
    right: 0,
    width: '180px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    boxShadow: '0 10px 30px rgba(17, 24, 39, 0.12)',
    overflow: 'hidden',
    zIndex: 30,
} as const

const dropdownItemLinkStyle = {
    display: 'block',
    padding: '14px 16px',
    color: '#374151',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 500,
    backgroundColor: '#ffffff',
} as const

const dropdownDividerStyle = {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '4px 0',
} as const

const dropdownLogoutButtonStyle = {
    width: '100%',
    border: 'none',
    backgroundColor: '#ffffff',
    color: '#374151',
    textAlign: 'left',
    padding: '14px 16px',
    fontSize: '15px',
    cursor: 'pointer',
} as const