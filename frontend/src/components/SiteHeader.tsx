import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const API_BASE_URL = 'http://localhost:8080'

type MemberInfo = {
    id: number
    nickName?: string
    name?: string
}

type NotificationItem = {
    notificationId: number
    title: string
    content: string
    read: boolean
    type: string
    targetType: string
    targetId: number | null
    relatedId: number | null
    createdAt: string
}

function formatNotificationTime(dateTime: string) {
    const date = new Date(dateTime)

    if (Number.isNaN(date.getTime())) {
        return dateTime
    }

    return date.toLocaleString('ko-KR', {
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
}

function getNotificationTargetPath(item: NotificationItem) {
    if (item.targetType === 'HOTDEAL' && item.targetId != null) {
        return `/hotdeals/${item.targetId}`
    }

    if (item.targetType === 'PRODUCT_INQUIRY' && item.relatedId != null) {
        return `/products/${item.relatedId}?tab=inquiry`
    }

    if (item.targetType === 'NOTICE' && item.targetId != null) {
        return `/notices/${item.targetId}`
    }

    return '/notifications'
}

function getErrorMessage(error: unknown, fallback: string) {
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

    return fallback
}

export default function SiteHeader() {
    const location = useLocation()
    const navigate = useNavigate()
    const menuRef = useRef<HTMLDivElement | null>(null)
    const notificationRef = useRef<HTMLDivElement | null>(null)

    const [loginMember, setLoginMember] = useState<MemberInfo | null>(null)
    const [menuOpen, setMenuOpen] = useState(false)

    const [notificationOpen, setNotificationOpen] = useState(false)
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [notificationLoading, setNotificationLoading] = useState(false)
    const [notificationError, setNotificationError] = useState('')

    const displayName = loginMember?.nickName ?? loginMember?.name ?? '회원'

    const unreadCount = useMemo(() => {
        return notifications.filter((item) => !item.read).length
    }, [notifications])

    useEffect(() => {
        async function loadMyInfo() {
            try {
                const response = await axios.get<MemberInfo | null>(
                    `${API_BASE_URL}/members/myinfo`,
                    {
                        withCredentials: true,
                    },
                )

                if (!response.data) {
                    setLoginMember(null)
                    return
                }

                setLoginMember(response.data)
            } catch (error) {
                setLoginMember(null)
            }
        }

        void loadMyInfo()
    }, [location.pathname, location.search, location.hash])

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node

            if (menuRef.current && !menuRef.current.contains(target)) {
                setMenuOpen(false)
            }

            if (notificationRef.current && !notificationRef.current.contains(target)) {
                setNotificationOpen(false)
            }
        }

        if (menuOpen || notificationOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [menuOpen, notificationOpen])

    useEffect(() => {
        setMenuOpen(false)
        setNotificationOpen(false)
    }, [location.pathname, location.search, location.hash])

    async function loadNotifications() {
        if (!loginMember) return

        try {
            setNotificationLoading(true)
            setNotificationError('')

            const response = await axios.get<NotificationItem[]>(`${API_BASE_URL}/notifications`, {
                withCredentials: true,
            })

            setNotifications(response.data)
        } catch (error) {
            setNotificationError(getErrorMessage(error, '알림을 불러오지 못했습니다.'))
        } finally {
            setNotificationLoading(false)
        }
    }

    useEffect(() => {
        if (notificationOpen && loginMember) {
            void loadNotifications()
        }
    }, [notificationOpen, loginMember])

    async function handleLogout() {
        try {
            await axios.post(
                `${API_BASE_URL}/logout`,
                {},
                { withCredentials: true },
            )

            setLoginMember(null)
            setMenuOpen(false)
            setNotificationOpen(false)
            navigate('/', { replace: true })
        } catch (error) {
            alert('로그아웃에 실패했습니다.')
        }
    }

    function handleNotificationToggle() {
        if (!loginMember) {
            navigate('/login', {
                state: {
                    from: {
                        pathname: location.pathname,
                        search: location.search,
                        hash: location.hash,
                    },
                },
            })
            return
        }

        setMenuOpen(false)
        setNotificationOpen((prev) => !prev)
    }

    async function handleReadAllNotifications() {
        if (unreadCount === 0) return

        try {
            await axios.patch(
                `${API_BASE_URL}/notifications/read-all`,
                {},
                { withCredentials: true },
            )

            setNotifications((prev) =>
                prev.map((item) => ({
                    ...item,
                    read: true,
                })),
            )
        } catch (error) {
            alert(getErrorMessage(error, '모두 읽음 처리에 실패했습니다.'))
        }
    }

    async function handleClickNotification(item: NotificationItem) {
        try {
            if (!item.read) {
                await axios.patch(
                    `${API_BASE_URL}/notifications/${item.notificationId}/read`,
                    {},
                    { withCredentials: true },
                )

                setNotifications((prev) =>
                    prev.map((target) =>
                        target.notificationId === item.notificationId
                            ? { ...target, read: true }
                            : target,
                    ),
                )
            }

            setNotificationOpen(false)
            navigate(getNotificationTargetPath(item))
        } catch (error) {
            alert(getErrorMessage(error, '알림 이동에 실패했습니다.'))
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
                        <Link to="/" style={homeLinkStyle}>
                            홈
                        </Link>

                        <Link to="/notices" style={navLinkStyle}>
                            공지
                        </Link>
                    </nav>
                </div>

                <div style={rightGroupStyle}>
                    <div style={notificationWrapStyle} ref={notificationRef}>
                        <button
                            type="button"
                            style={iconButtonStyle}
                            aria-label="알림"
                            onClick={handleNotificationToggle}
                        >
                            🔔
                            {loginMember && unreadCount > 0 && (
                                <span style={notificationBadgeStyle}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {notificationOpen && (
                            <div style={notificationDropdownStyle}>
                                <div style={notificationDropdownHeaderStyle}>
                                    <div style={notificationDropdownTitleWrapStyle}>
                                        <span style={notificationDropdownTitleStyle}>알림</span>
                                        <span style={notificationDropdownCountStyle}>
                                            안 읽음 {unreadCount}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        style={{
                                            ...notificationReadAllButtonStyle,
                                            opacity: unreadCount === 0 ? 0.5 : 1,
                                            cursor: unreadCount === 0 ? 'not-allowed' : 'pointer',
                                        }}
                                        onClick={handleReadAllNotifications}
                                        disabled={unreadCount === 0}
                                    >
                                        모두 읽음
                                    </button>
                                </div>

                                <div style={notificationListWrapStyle}>
                                    {notificationLoading ? (
                                        <div style={notificationStateStyle}>
                                            알림을 불러오는 중입니다...
                                        </div>
                                    ) : notificationError ? (
                                        <div style={notificationStateStyle}>{notificationError}</div>
                                    ) : notifications.length === 0 ? (
                                        <div style={notificationStateStyle}>
                                            도착한 알림이 없습니다.
                                        </div>
                                    ) : (
                                        notifications.slice(0, 5).map((item) => (
                                            <button
                                                key={item.notificationId}
                                                type="button"
                                                onClick={() => handleClickNotification(item)}
                                                style={{
                                                    ...notificationItemStyle,
                                                    backgroundColor: item.read
                                                        ? '#f8fafc'
                                                        : '#ffffff',
                                                }}
                                            >
                                                <div style={notificationItemTopStyle}>
                                                    <span style={notificationItemTitleStyle}>
                                                        {item.title}
                                                    </span>
                                                    <span style={notificationItemTimeStyle}>
                                                        {formatNotificationTime(item.createdAt)}
                                                    </span>
                                                </div>

                                                <p style={notificationItemContentStyle}>
                                                    {item.content}
                                                </p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <Link to="/cart-items" style={iconLinkStyle} aria-label="장바구니">
                        🛒
                    </Link>

                    <Link
                        to={loginMember ? '/mypage/orders' : '/login'}
                        style={iconLinkStyle}
                        aria-label="주문목록"
                    >
                        🚚
                    </Link>

                    {loginMember ? (
                        <div style={profileMenuWrapStyle} ref={menuRef}>
                            <button
                                type="button"
                                style={profileButtonStyle}
                                onClick={() => {
                                    setNotificationOpen(false)
                                    setMenuOpen((prev) => !prev)
                                }}
                            >
                                <span style={profileAvatarStyle}>👤</span>
                                <span style={profileNameStyle}>{displayName}</span>
                                <span style={profileArrowStyle}>
                                    {menuOpen ? '▴' : '▾'}
                                </span>
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
                                        to="/mypage/orders"
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

const homeLinkStyle = {
    textDecoration: 'none',
    color: '#111827',
    fontSize: '16px',
    fontWeight: 800,
    paddingBottom: '0',
    borderBottom: 'none',
} as const

const navLinkStyle = {
    textDecoration: 'none',
    color: '#111827',
    fontSize: '16px',
    fontWeight: 700,
} as const

const rightGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
} as const

const notificationWrapStyle = {
    position: 'relative',
} as const

const iconButtonStyle = {
    position: 'relative',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '24px',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
} as const

const notificationBadgeStyle = {
    position: 'absolute',
    top: '-8px',
    right: '-10px',
    minWidth: '18px',
    height: '18px',
    borderRadius: '999px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 5px',
} as const

const notificationDropdownStyle = {
    position: 'absolute',
    top: '40px',
    right: 0,
    width: '360px',
    border: '1px solid #d1d5db',
    borderRadius: '18px',
    backgroundColor: '#ffffff',
    boxShadow: '0 16px 32px rgba(17, 24, 39, 0.12)',
    overflow: 'hidden',
    zIndex: 40,
} as const

const notificationDropdownHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 18px',
    borderBottom: '1px solid #e5e7eb',
} as const

const notificationDropdownTitleWrapStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
} as const

const notificationDropdownTitleStyle = {
    color: '#111827',
    fontSize: '16px',
    fontWeight: 800,
} as const

const notificationDropdownCountStyle = {
    color: '#2563eb',
    fontSize: '13px',
    fontWeight: 700,
} as const

const notificationReadAllButtonStyle = {
    border: '1px solid #bfdbfe',
    backgroundColor: '#ffffff',
    color: '#2563eb',
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: 700,
} as const

const notificationListWrapStyle = {
    maxHeight: '360px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
} as const

const notificationStateStyle = {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '14px',
} as const

const notificationItemStyle = {
    width: '100%',
    border: 'none',
    borderBottom: '1px solid #e5e7eb',
    padding: '16px 18px',
    textAlign: 'left',
    cursor: 'pointer',
} as const

const notificationItemTopStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '10px',
    marginBottom: '8px',
} as const

const notificationItemTitleStyle = {
    color: '#111827',
    fontSize: '15px',
    fontWeight: 800,
    lineHeight: 1.4,
} as const

const notificationItemTimeStyle = {
    color: '#9ca3af',
    fontSize: '12px',
    whiteSpace: 'nowrap',
} as const

const notificationItemContentStyle = {
    margin: 0,
    color: '#4b5563',
    fontSize: '13px',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
} as const

const iconLinkStyle = {
    textDecoration: 'none',
    fontSize: '24px',
    lineHeight: 1,
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
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#111827',
    borderRadius: '10px',
    padding: '0 12px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: 'none',
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
    fontSize: '22px',
    fontWeight: 700,
    color: '#6b7280',
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
} as const

const dropdownMenuStyle = {
    position: 'absolute',
    top: '56px',
    right: 0,
    width: '132px',
    border: '1px solid #d1d5db',
    borderRadius: '0',
    backgroundColor: '#ffffff',
    boxShadow: '0 10px 24px rgba(17, 24, 39, 0.08)',
    overflow: 'hidden',
    zIndex: 30,
} as const

const dropdownItemLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '54px',
    color: '#374151',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 500,
    backgroundColor: '#ffffff',
} as const

const dropdownDividerStyle = {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '0',
} as const

const dropdownLogoutButtonStyle = {
    width: '100%',
    height: '48px',
    border: 'none',
    backgroundColor: '#ffffff',
    color: '#374151',
    textAlign: 'center',
    fontSize: '15px',
    cursor: 'pointer',
} as const