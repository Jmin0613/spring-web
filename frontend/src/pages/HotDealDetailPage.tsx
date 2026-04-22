import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link, useParams } from 'react-router-dom'

type HotDealDetail = {
    description: string
    discountRate: number
    endTime: string
    hotDealId: number
    hotDealPrice: number
    hotDealStock: number
    imageUrl: string | null
    originalPrice: number
    productName: string
    productId: number | null
    startTime: string
    status: string
}

const API_BASE_URL = 'http://localhost:8080'

function formatPrice(price: number) {
    return `${price.toLocaleString('ko-KR')}원`
}

function formatDateTime(dateString: string) {
    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
        return dateString
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')

    return `${year}.${month}.${day} ${hour}:${minute}`
}

function getStatusLabel(status: string) {
    if (status === 'ON_SALE') {
        return '진행중'
    }

    if (status === 'READY') {
        return '오픈예정'
    }

    if (status === 'SOLD_OUT') {
        return '품절'
    }

    return status
}

function getEmoji(name: string) {
    if (name.includes('강아지')) {
        return '🐶'
    }

    if (name.includes('고양이')) {
        return '🐱'
    }

    if (name.includes('비타민')) {
        return '💊'
    }

    return '🎁'
}

export default function HotDealDetailPage() {
    const { id } = useParams()
    const [detail, setDetail] = useState<HotDealDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function loadHotDealDetail() {
            if (!id) {
                setError('잘못된 접근입니다.')
                setLoading(false)
                return
            }

            try {
                const response = await axios.get<HotDealDetail>(`${API_BASE_URL}/hotdeals/${id}`)
                setDetail(response.data)
            } catch (e) {
                setError('핫딜 상세를 불러오지 못했습니다.')
            } finally {
                setLoading(false)
            }
        }

        loadHotDealDetail()
    }, [id])

    const periodText = useMemo(() => {
        if (!detail) {
            return ''
        }

        return `${formatDateTime(detail.startTime)} ~ ${formatDateTime(detail.endTime)}`
    }, [detail])

    if (loading) {
        return <PageState text="핫딜 상세를 불러오는 중입니다..." />
    }

    if (error) {
        return <PageState text={error} />
    }

    if (!detail) {
        return <PageState text="핫딜 정보를 찾을 수 없습니다." />
    }

    return (
        <div style={pageStyle}>
            <div style={containerStyle}>
                <div style={breadcrumbStyle}>
                    <Link to="/" style={breadcrumbLinkStyle}>
                        홈
                    </Link>
                    <span style={breadcrumbDividerStyle}>/</span>
                    <span>핫딜 상세</span>
                </div>

                <section style={heroSectionStyle}>
                    <div style={heroImageWrapStyle}>
                        <div style={heroImageStyle}>
                            <div style={heroImageBadgeStyle}>대표 이미지</div>
                            <div style={{ fontSize: '140px' }}>{getEmoji(detail.productName)}</div>
                        </div>
                    </div>

                    <div style={heroInfoStyle}>
                        <div style={statusBadgeStyle}>{getStatusLabel(detail.status)}</div>

                        <h1 style={titleStyle}>{detail.productName}</h1>
                        <p style={shortDescriptionStyle}>{detail.description}</p>

                        <div style={priceBoxStyle}>
                            <div style={discountRowStyle}>
                                <span style={discountRateStyle}>{detail.discountRate}%</span>
                                <span style={salePriceStyle}>{formatPrice(detail.hotDealPrice)}</span>
                            </div>
                            <div style={originalPriceStyle}>{formatPrice(detail.originalPrice)}</div>
                            <div style={periodNoticeStyle}>핫딜 안내 {periodText} 까지 한정할인</div>
                        </div>

                        <div style={optionBoxStyle}>
                            <div style={optionTitleStyle}>구매 옵션</div>
                            <div style={optionPlaceholderStyle}>수량 선택 / 옵션 선택 영역 (추후 구현)</div>
                        </div>

                        <div style={buttonRowStyle}>
                            <button type="button" style={ghostButtonStyle}>
                                공유
                            </button>
                            <button type="button" style={ghostButtonStyle}>
                                찜하기
                            </button>
                            <button type="button" style={ghostButtonStyle}>
                                장바구니
                            </button>
                            <button type="button" style={primaryButtonStyle}>
                                구매하기
                            </button>
                        </div>
                    </div>
                </section>

                <section style={tabWrapStyle}>
                    <div style={tabHeaderStyle}>
                        <button type="button" style={activeTabStyle}>
                            상세정보
                        </button>
                        <button type="button" style={tabStyle}>
                            상품후기
                        </button>
                        <button type="button" style={tabStyle}>
                            상품문의
                        </button>
                    </div>

                    <div style={detailContentWrapStyle}>
                        <div style={placeholderImageBoxStyle}>
                            <div style={placeholderImageTitleStyle}>상세 설명 이미지</div>
                            <div style={placeholderImageSubTitleStyle}>리팩토링 전까지 임시 플레이스홀더</div>
                        </div>

                        <div style={detailTextBoxStyle}>
                            <h2 style={detailSectionTitleStyle}>상품 설명</h2>
                            <p style={detailTextStyle}>{detail.description}</p>
                            <p style={detailTextStyle}>
                                현재는 긴 설명 이미지를 아직 붙이지 않은 상태라, 실제 상세 이미지가 있는 것처럼
                                보이도록 임시 플레이스홀더 박스를 넣어두었습니다.
                            </p>
                            <p style={detailTextStyle}>
                                이후 리팩토링 단계에서 실제 상세 이미지 파일 또는 이미지 URL을 연결할 예정입니다.
                            </p>
                        </div>
                    </div>
                </section>

                <div style={bottomButtonWrapStyle}>
                    <Link to="/" style={backButtonStyle}>
                        목록으로
                    </Link>
                </div>
            </div>
        </div>
    )
}

function PageState({ text }: { text: string }) {
    return (
        <div style={pageStyle}>
            <div style={containerStyle}>
                <div style={stateBoxStyle}>{text}</div>
            </div>
        </div>
    )
}

const pageStyle = {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    padding: '40px 24px 96px',
    color: '#111827',
} as const

const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
} as const

const breadcrumbStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '22px',
    color: '#6b7280',
    fontSize: '14px',
} as const

const breadcrumbLinkStyle = {
    color: '#6b7280',
    textDecoration: 'none',
} as const

const breadcrumbDividerStyle = {
    color: '#d1d5db',
} as const

const heroSectionStyle = {
    display: 'grid',
    gridTemplateColumns: '1.05fr 1fr',
    gap: '28px',
    alignItems: 'start',
} as const

const heroImageWrapStyle = {
    width: '100%',
} as const

const heroImageStyle = {
    position: 'relative',
    minHeight: '540px',
    border: '1px solid #ececec',
    borderRadius: '28px',
    background: 'linear-gradient(135deg, #fff8dc 0%, #f3f4f6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
} as const

const heroImageBadgeStyle = {
    position: 'absolute',
    top: '18px',
    left: '18px',
    borderRadius: '999px',
    backgroundColor: '#fff6cc',
    color: '#9a6b00',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 800,
    border: '1px solid #f1c84b',
} as const

const heroInfoStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
} as const

const statusBadgeStyle = {
    alignSelf: 'flex-start',
    borderRadius: '999px',
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 800,
} as const

const titleStyle = {
    margin: 0,
    fontSize: '38px',
    fontWeight: 900,
    lineHeight: 1.32,
    letterSpacing: '-0.04em',
    wordBreak: 'keep-all',
} as const

const shortDescriptionStyle = {
    margin: 0,
    color: '#6b7280',
    fontSize: '17px',
    lineHeight: 1.7,
} as const

const priceBoxStyle = {
    border: '1px solid #ececec',
    borderRadius: '22px',
    padding: '24px',
    backgroundColor: '#ffffff',
} as const

const discountRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
} as const

const discountRateStyle = {
    color: '#dc2626',
    fontSize: '28px',
    fontWeight: 900,
} as const

const salePriceStyle = {
    color: '#111827',
    fontSize: '40px',
    fontWeight: 900,
    letterSpacing: '-0.03em',
} as const

const originalPriceStyle = {
    marginTop: '10px',
    color: '#9ca3af',
    fontSize: '18px',
    textDecoration: 'line-through',
} as const

const periodNoticeStyle = {
    marginTop: '16px',
    color: '#1d4ed8',
    fontSize: '15px',
    fontWeight: 700,
} as const

const optionBoxStyle = {
    border: '1px solid #ececec',
    borderRadius: '20px',
    padding: '22px 24px',
    backgroundColor: '#ffffff',
} as const

const optionTitleStyle = {
    fontSize: '16px',
    fontWeight: 800,
    marginBottom: '12px',
} as const

const optionPlaceholderStyle = {
    border: '1px dashed #d1d5db',
    borderRadius: '14px',
    padding: '18px 16px',
    color: '#6b7280',
    fontSize: '15px',
} as const

const buttonRowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1.2fr 1.4fr',
    gap: '12px',
} as const

const ghostButtonStyle = {
    height: '52px',
    borderRadius: '14px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#111827',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
} as const

const primaryButtonStyle = {
    height: '52px',
    borderRadius: '14px',
    border: 'none',
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 800,
    cursor: 'pointer',
} as const

const tabWrapStyle = {
    marginTop: '48px',
} as const

const tabHeaderStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
    marginBottom: '24px',
} as const

const activeTabStyle = {
    height: '52px',
    borderRadius: '14px',
    border: '1px solid #111827',
    backgroundColor: '#111827',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
} as const

const tabStyle = {
    height: '52px',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    color: '#6b7280',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
} as const

const detailContentWrapStyle = {
    display: 'grid',
    gap: '24px',
} as const

const placeholderImageBoxStyle = {
    minHeight: '420px',
    borderRadius: '24px',
    border: '1px dashed #d1d5db',
    background: 'linear-gradient(180deg, #f9fafb 0%, #fffdf4 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
} as const

const placeholderImageTitleStyle = {
    color: '#111827',
    fontSize: '28px',
    fontWeight: 900,
} as const

const placeholderImageSubTitleStyle = {
    color: '#6b7280',
    fontSize: '16px',
} as const

const detailTextBoxStyle = {
    borderRadius: '24px',
    border: '1px solid #ececec',
    padding: '32px',
    backgroundColor: '#ffffff',
} as const

const detailSectionTitleStyle = {
    margin: '0 0 18px',
    fontSize: '24px',
    fontWeight: 900,
} as const

const detailTextStyle = {
    margin: '0 0 14px',
    color: '#374151',
    fontSize: '17px',
    lineHeight: 1.9,
    whiteSpace: 'pre-wrap',
} as const

const bottomButtonWrapStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '36px',
} as const

const backButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '140px',
    height: '50px',
    borderRadius: '14px',
    border: '1px solid #d1d5db',
    textDecoration: 'none',
    color: '#111827',
    fontWeight: 700,
    backgroundColor: '#ffffff',
} as const

const stateBoxStyle = {
    border: '1px solid #ececec',
    borderRadius: '24px',
    padding: '80px 24px',
    textAlign: 'center',
    color: '#6b7280',
    backgroundColor: '#ffffff',
    fontSize: '16px',
} as const
