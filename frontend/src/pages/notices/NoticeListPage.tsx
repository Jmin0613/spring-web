import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { fetchNoticeList } from '../../api/noticeApi.ts'
import type { NoticeListItem } from '../../types/notice.ts'
import './NoticeListPage.css'
import SiteHeader from '../../components/SiteHeader.tsx'

const API_BASE_URL = 'http://localhost:8080'

// 관리자인지 아닌지 확인용도
type MemberInfo = {
    id: number
    loginId?: string // 비로그인일 수도 있음
    name?: string
    nickname?: string
    role?: 'ADMIN' | 'USER' // 관리자 OR 일반회원
}

function formatDate(dateString: string) {
    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
        return dateString
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    // padStart(targetLength, padString) :
    // 현재 문자열 길이가 targetLength보다 짧은 경우, 그 차이만큼 padString을 앞에 채워넣음

    return `${year}.${month}.${day}`
}

export default function NoticeListPage() {
    const [notices, setNotices] = useState<NoticeListItem[]>([])
    // 서버에서 받아온 실제 공지목록 데이터들을 배열에 담음
    // 타입은 NoticeListItem[]으로 정의되어있고, 각 공지사항이 어떤 속성(id, title 등)을 가져야 하는지 미리 약속됨

    const [loading, setLoading] = useState(true)
    // 현재 데이터를 가져오는 중(true)인지, 아니면 완료(false)되었는지 나타냄
    // true일 때는 화면에 "로딩 중"을 보여주고, false가 되면 실제 데이터를 보여주는 식으로 화면을 분기 처리

    const [error, setError] = useState('')
    // 데이터를 가져오다가 문제가 생겼을 때의 메세지를 담음
    // if(error) 조건문을 써서 사용자에게 데이터를 불러오지 못했단 경고 문구를 보여줄 때 사용함.
    // 빈 문자열이면 에러가 없는 상태임.

    const [searchKeyword, setSearchKeyword] = useState('')
    // 사용자가 검색창에 입력한 텍스트를 실시간으로 저장함
    // 검색창의 value로 연결하고, 입력값이 바뀔 때마다 필터링된 공지 목록을 보여줄 때 사용함.

    const [loginMember, setLoginMember] = useState<MemberInfo | null>(null)
    // 접속한 사람이 관리자인지 아닌지 Role 확인

    const isAdmin = loginMember?.role === 'ADMIN' // 관리자 확인 저장.

    // 공지 목록 불러오기
    useEffect(() => {
        async function loadNotices() {
            try {
                const data = await fetchNoticeList() // 공지 목록(NoticeListItem[]) 데이터를 받아와서
                setNotices(data) // 집어넣기
            } catch (err) {
                setError('공지 목록을 불러오지 못했습니다.')
            } finally {
                setLoading(false) // 로딩 완료 처리
            }
        }

        void loadNotices()
    }, []) // [] -> 화면 실행할 때 딱 한 번만 실행하라.

    // 관리자인지 아닌지 확인
    useEffect(() => {
        async function loadMyInfo() {
            try {
                const response = await axios.get<MemberInfo | null>(
                    `${API_BASE_URL}/member/myinfo`,
                    // notice API의 목적은 '공지 목록'을 주는 것
                    // 현재 로그인한 사람 정보는 별도 회원정보 API를 통해 가져오기.
                    // -> notice가 로그인한 사람 정보까지 담기에는 하는 일이 많아짐. 있는 것 가져다 재활용하기.
                    {
                        withCredentials: true,
                    },
                )

                setLoginMember(response.data ?? null)
            } catch (error) {
                setLoginMember(null)
            }
        }

        void loadMyInfo()
    }, [])

    // 공지들 중에서 사용자가 검색한 글자만 포함된 것들로 골라내는 필터링
    const filteredNotices = useMemo(() => {
        const trimmedKeyword = searchKeyword.trim().toLowerCase()
        // 사용자가 입력한 검색어의 앞뒤 공백 제거(trim)
        // 영어라면 소문자로 통일(toLowerCase) -> 대소문자 구분 없이 검색하기 위해.

        if (!trimmedKeyword) {
            // 검색창 비어있으면
            return notices // 필터링 필요 x, 전체 공지 notice 그대로 반환
        }

        // 검색창에 입력 들어있으면
        return notices.filter((notice) =>
            notice.title.toLowerCase().includes(trimmedKeyword),
        )
        // 공지 제목에 사용자가 입력한 글자가 포함되어있는지 검사
        // 포함된 것만 따로 모아 새로운 리스트 생성
    }, [notices, searchKeyword]) // 공지목록이 바뀌거나 검색어 바뀔 때만 실행.

    if (loading) {
        return (
            <div className="notice-page">
                <SiteHeader />
                <main className="notice-container">
                    <div className="notice-state-text">공지 목록을 불러오는 중입니다...</div>
                </main>
            </div>
        )
    }

    if (error) {
        return (
            <div className="notice-page">
                <SiteHeader />
                <main className="notice-container">
                    <div className="notice-state-text">{error}</div>
                </main>
            </div>
        )
    }

    return (
        <div className="notice-page">
            <SiteHeader />

            <main className="notice-container">
                <section className="notice-header">
                    <p className="notice-header-badge">NOTICE</p>
                    <h1 className="notice-title">공지사항</h1>
                    <p className="notice-description">
                        쇼핑몰 이용 안내와 주요 업데이트 소식을 확인해보세요.
                    </p>
                </section>

                <section className="notice-toolbar">
                    <div className="notice-count">
                        총 <strong>{filteredNotices.length}</strong>건
                    </div>

                    <div className="notice-toolbar-right">
                        <div className="notice-search-box">
                            <input
                                value={searchKeyword}
                                onChange={(event) => setSearchKeyword(event.target.value)}
                                className="notice-search-input"
                                placeholder="공지 제목 검색"
                            />
                        </div>
                    </div>
                </section>

                <section className="notice-list-section">
                    <div className="notice-list-head">
                        <span className="notice-list-head-title">제목</span>
                        <span className="notice-list-head-date">작성일</span>
                    </div>

                    {filteredNotices.length === 0 ? (
                        <div className="notice-empty-box">
                            검색 결과에 해당하는 공지가 없습니다.
                        </div>
                    ) : (
                        <ul className="notice-list">
                            {filteredNotices.map((notice) => (
                                <li className="notice-item" key={notice.id}>
                                    <Link
                                        to={`/notices/${notice.id}`}
                                        className="notice-item-link"
                                    >
                                        <span className="notice-item-title">
                                            {notice.title}
                                        </span>
                                        <span className="notice-item-date">
                                            {formatDate(notice.createdAt)}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {isAdmin && (
                    <div className="notice-admin-write-row">
                        <Link className="notice-admin-write-button" to="/admin/notices/new">
                            글쓰기
                        </Link>
                    </div>
                )}

                <div className="notice-pagination">
                    <button className="notice-page-button is-active" type="button">
                        1
                    </button>
                </div>
            </main>
        </div>
    )
}