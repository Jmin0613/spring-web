import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './SiteHeader.css'

const API_BASE_URL = 'http://localhost:8080'

type MemberInfo = {
    id: number
    loginId?: string
    name?: string
    nickName?: string
    nickname?: string
    role?: 'ADMIN' | 'USER'
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

    const displayName =
        loginMember?.nickName ?? loginMember?.nickname ?? loginMember?.name ?? '회원'

    const isAdmin = loginMember?.role === 'ADMIN'
    const myPagePath = isAdmin ? '/admin' : '/mypage'
    const myPageLabel = isAdmin ? '관리자 페이지' : '마이페이지'

    const unreadCount = useMemo(() => {
        return notifications.filter((item) => !item.read).length
    }, [notifications])

    useEffect(() => {
        async function loadMyInfo() {
            try {
                const response = await axios.get<MemberInfo | null>(
                    `${API_BASE_URL}/member/myinfo`,
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

            const response = await axios.get<NotificationItem[]>(
                `${API_BASE_URL}/notifications`,
                {
                    withCredentials: true,
                },
            )

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
                {
                    withCredentials: true,
                },
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
                {
                    withCredentials: true,
                },
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
                    {
                        withCredentials: true,
                    },
                )

                setNotifications((prev) =>
                    prev.map((target) =>
                        target.notificationId === item.notificationId
                            ? {
                                ...target,
                                read: true,
                            }
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
        <header className="site-header">
            <div className="site-header__inner">
                <div className="site-header__left">
                    <Link to="/" className="site-header__logo">
                        <span className="site-header__logo-main">WAT</span>
                        <span className="site-header__logo-percent">%</span>
                    </Link>

                    <nav className="site-header__nav">
                        <Link to="/" className="site-header__nav-link site-header__nav-link--home">
                            홈
                        </Link>

                        <Link to="/notices" className="site-header__nav-link">
                            공지
                        </Link>
                    </nav>
                </div>

                <div className="site-header__right">
                    <div className="site-header__notification-wrap" ref={notificationRef}>
                        <button
                            type="button"
                            className="site-header__icon-button"
                            aria-label="알림"
                            onClick={handleNotificationToggle}
                        >
                            🔔
                            {loginMember && unreadCount > 0 && (
                                <span className="site-header__notification-badge">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {notificationOpen && (
                            <div className="site-header__notification-dropdown">
                                <div className="site-header__notification-header">
                                    <div className="site-header__notification-title-wrap">
                                        <span className="site-header__notification-title">
                                            알림
                                        </span>
                                        <span className="site-header__notification-count">
                                            안 읽음 {unreadCount}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className="site-header__notification-read-all-button"
                                        onClick={handleReadAllNotifications}
                                        disabled={unreadCount === 0}
                                    >
                                        모두 읽음
                                    </button>
                                </div>

                                <div className="site-header__notification-list">
                                    {notificationLoading ? (
                                        <div className="site-header__notification-state">
                                            알림을 불러오는 중입니다...
                                        </div>
                                    ) : notificationError ? (
                                        <div className="site-header__notification-state">
                                            {notificationError}
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="site-header__notification-state">
                                            도착한 알림이 없습니다.
                                        </div>
                                    ) : (
                                        notifications.slice(0, 5).map((item) => (
                                            <button
                                                key={item.notificationId}
                                                type="button"
                                                onClick={() => handleClickNotification(item)}
                                                className={
                                                    item.read
                                                        ? 'site-header__notification-item site-header__notification-item--read'
                                                        : 'site-header__notification-item'
                                                }
                                            >
                                                <div className="site-header__notification-item-top">
                                                    <span className="site-header__notification-item-title">
                                                        {item.title}
                                                    </span>
                                                    <span className="site-header__notification-item-time">
                                                        {formatNotificationTime(item.createdAt)}
                                                    </span>
                                                </div>

                                                <p className="site-header__notification-item-content">
                                                    {item.content}
                                                </p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {!isAdmin && (
                        <Link
                            to="/cart-items"
                            className="site-header__icon-link"
                            aria-label="장바구니"
                        >
                            🛒
                        </Link>
                    )}

                    {loginMember ? (
                        <div className="site-header__profile-wrap" ref={menuRef}>
                            <button
                                type="button"
                                className="site-header__profile-button"
                                onClick={() => {
                                    setNotificationOpen(false)
                                    setMenuOpen((prev) => !prev)
                                }}
                            >
                                <span className="site-header__profile-avatar">👤</span>
                                <span className="site-header__profile-name">{displayName}</span>
                                <span className="site-header__profile-arrow">
                                    {menuOpen ? '▴' : '▾'}
                                </span>
                            </button>

                            {menuOpen && (
                                <div className="site-header__dropdown-menu">
                                    <Link
                                        to={myPagePath}
                                        className="site-header__dropdown-item"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        {myPageLabel}
                                    </Link>

                                    {!isAdmin && (
                                        <>
                                            <Link
                                                to="/wishlist"
                                                className="site-header__dropdown-item"
                                                onClick={() => setMenuOpen(false)}
                                            >
                                                찜한 상품
                                            </Link>

                                            <Link
                                                to="/mypage/orders"
                                                className="site-header__dropdown-item"
                                                onClick={() => setMenuOpen(false)}
                                            >
                                                주문 목록
                                            </Link>
                                        </>
                                    )}

                                    <div className="site-header__dropdown-divider" />

                                    <button
                                        type="button"
                                        className="site-header__dropdown-logout-button"
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
                            className="site-header__login-button"
                        >
                            로그인
                        </Link>
                    )}
                </div>
            </div>
        </header>
    )
}