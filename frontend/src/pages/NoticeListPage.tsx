import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchNoticeList } from '../api/noticeApi'
import type { NoticeListItem } from '../types/notice'
import './NoticeListPage.css'
import SiteHeader from '../components/SiteHeader'

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
    // true일때는 화면에 "로딩 중"을 보여주고, false가 되면 실제 데이터를 보여주는 식으로 화면을 분기 처리

    const [error, setError] = useState('')
    // 데이터를 가져오다가 문제가 생겼을 때의 메세지를 담음
    // if(error)조건문을 써서 사용자에게 데이터를 불러오지 못했단 경고 문구를 보여줄 때 사용함.
    // 빈 문자열이면 에러가 없는 상태임.

    const [searchKeyword, setSearchKeyword] = useState('')
    // 사용자가 검색창에 입력한 텍스트를 실시간으로 저장함
    // 검색창의 value로 연결되거나, 검색버튼을 눌렀을 때 이 키워드를 서버에 보내서 필터링된 결과를 요청할 때 사용함.

    // 공지 목록 불러오기
    useEffect(() => {
        async function loadNotices() { //함수 정의
            try {
                const data = await fetchNoticeList() //공지 목록(NoticeListItem[]) 데이터를 받아와서
                setNotices(data) // 집어넣기
            } catch (err) {
                setError('공지 목록을 불러오지 못했습니다.')
            } finally {
                setLoading(false) //로딩 완료 처리
            }
        }

        loadNotices() //정의한 함수 호출하여 실행시키기.
    }, []) // []) -> 화면 실행할때 딱 한 번만 실행하라.

    // 공지들 중에서 사용자가 검색한 글자만 포함된 것들로 골라내는 필터링
    const filteredNotices = useMemo(() => {
        const trimmedKeyword = searchKeyword.trim().toLowerCase()
        // 사용자가 입력한 검색어의 앞뒤 공백 제거(trim)
        // 영어라면 소문자로 통일(toLowerCase) -> 대소문자 구분 없이 검색하기 위해.

        if (!trimmedKeyword) { // 검색창 비어있으면
            return notices //필터링 필요x, 전체 공지notice 그대로 반환
        }

        // 검색창에 입력 들어있으면
        return notices.filter((notice) =>
            notice.title.toLowerCase().includes(trimmedKeyword),
            // 공지 제목에 사용자가 입력한 글자가 포함되어있는지 검사
            // 포함된 것만 따로 마오 새로운 리스트 생성
        )
    }, [notices, searchKeyword]) // 공지목록이 바뀌거나 검색어 바뀔때만 실행.

    if (loading) {
        return (
            <div className="notice-page">
                <SiteHeader />
                <div className="notice-container">
                    <p className="notice-state-text">공지 목록을 불러오는 중입니다...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="notice-page">
                <SiteHeader />
                <div className="notice-container">
                    <p className="notice-state-text">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="notice-page">
            <SiteHeader />
            <div className="notice-container">
                <header className="notice-header">
                    <p className="notice-header-badge">NOTICE</p>
                    <h1 className="notice-title">공지사항</h1>
                    <p className="notice-description">
                        쇼핑몰 이용 안내와 주요 업데이트 소식을 확인해보세요.
                    </p>
                </header>

                <section className="notice-toolbar">
                    <div className="notice-toolbar-left">
            <span className="notice-count">
              총 <strong>{filteredNotices.length}</strong>건
            </span>
                    </div>

                    <div className="notice-search-box">
                        <input
                            type="text"
                            placeholder="공지 제목을 검색해보세요"
                            value={searchKeyword}
                            onChange={(event) => setSearchKeyword(event.target.value)}
                            className="notice-search-input"
                        />
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
                                <li key={notice.id} className="notice-item">
                                    <Link
                                        to={`/notices/${notice.id}`}
                                        className="notice-item-link"
                                    >
                                        <span className="notice-item-title">{notice.title}</span>
                                        <span className="notice-item-date">
                      {formatDate(notice.createdAt)}
                    </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <div className="notice-pagination">
                    <button type="button" className="notice-page-button is-active">
                        1
                    </button>
                </div>
            </div>
        </div>
    )
}
