import { type FormEvent, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import SiteHeader from '../../../components/SiteHeader.tsx'
import {
    fetchAdminHotDealDetail,
    type AdminHotDealDetail,
    updateAdminHotDeal,
} from '../../../api/adminHotDealApi.ts'
import './AdminHotDealFormPage.css'

const API_BASE_URL = 'http://localhost:8080'

type MemberInfo = {
    id: number
    loginId?: string
    name?: string
    nickname?: string
    role?: 'ADMIN' | 'USER'
}

type Meridiem = 'AM' | 'PM'

type HotDealForm = {
    hotDealPrice: string
    hotDealStock: string

    startDate: string
    startMeridiem: Meridiem
    startHour: string
    startMinute: string

    endDate: string
    endMeridiem: Meridiem
    endHour: string
    endMinute: string
}

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, '0'),
)

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) =>
    String(index).padStart(2, '0'),
)

function formatPrice(price: number) {
    return `${price.toLocaleString('ko-KR')}원`
}

function to24Hour(meridiem: Meridiem, hourValue: string) {
    const hour = Number(hourValue)

    if (meridiem === 'AM') {
        return hour === 12 ? 0 : hour
    }

    return hour === 12 ? 12 : hour + 12
}

function buildRequestDateTime(
    dateValue: string,
    meridiem: Meridiem,
    hourValue: string,
    minuteValue: string,
) {
    const hour24 = String(to24Hour(meridiem, hourValue)).padStart(2, '0')

    return `${dateValue}T${hour24}:${minuteValue}:00`
}

function buildDateObject(
    dateValue: string,
    meridiem: Meridiem,
    hourValue: string,
    minuteValue: string,
) {
    return new Date(buildRequestDateTime(dateValue, meridiem, hourValue, minuteValue))
}

function parseDateTimeToFormParts(dateTime: string) {
    const [datePart, timePart = '00:00:00'] = dateTime.split('T')
    const [hourText = '0', minuteText = '0'] = timePart.split(':')

    const hour24 = Number(hourText)
    const minute = Number(minuteText)

    const meridiem: Meridiem = hour24 < 12 ? 'AM' : 'PM'
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12

    return {
        date: datePart,
        meridiem,
        hour: String(hour12).padStart(2, '0'),
        minute: String(Number.isNaN(minute) ? 0 : minute).padStart(2, '0'),
    }
}

function getHotDealStatusLabel(status: string) {
    if (status === 'READY') return '오픈예정'
    if (status === 'ON_SALE') return '진행중'
    if (status === 'ENDED') return '종료'
    if (status === 'STOPPED') return '중단'
    return status
}

function getErrorMessage(error: unknown) {
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

    return '핫딜 수정에 실패했습니다.'
}

function HotDealTimeInput({
                              dateValue,
                              meridiem,
                              hour,
                              minute,
                              onDateChange,
                              onMeridiemChange,
                              onHourChange,
                              onMinuteChange,
                          }: {
    dateValue: string
    meridiem: Meridiem
    hour: string
    minute: string
    onDateChange: (value: string) => void
    onMeridiemChange: (value: Meridiem) => void
    onHourChange: (value: string) => void
    onMinuteChange: (value: string) => void
}) {
    return (
        <div className="admin-hotdeal-time-group">
            <input
                className="admin-hotdeal-time-date-input"
                type="date"
                value={dateValue}
                onChange={(e) => onDateChange(e.target.value)}
            />

            <select
                className="admin-hotdeal-time-select admin-hotdeal-time-meridiem-select"
                value={meridiem}
                onChange={(e) => onMeridiemChange(e.target.value as Meridiem)}
            >
                <option value="AM">오전</option>
                <option value="PM">오후</option>
            </select>

            <select
                className="admin-hotdeal-time-select"
                value={hour}
                onChange={(e) => onHourChange(e.target.value)}
            >
                {HOUR_OPTIONS.map((hourOption) => (
                    <option key={hourOption} value={hourOption}>
                        {hourOption}
                    </option>
                ))}
            </select>

            <span className="admin-hotdeal-time-unit">시</span>

            <select
                className="admin-hotdeal-time-select"
                value={minute}
                onChange={(e) => onMinuteChange(e.target.value)}
            >
                {MINUTE_OPTIONS.map((minuteOption) => (
                    <option key={minuteOption} value={minuteOption}>
                        {minuteOption}
                    </option>
                ))}
            </select>

            <span className="admin-hotdeal-time-unit">분</span>
        </div>
    )
}

export default function AdminHotDealEditPage() {
    const { hotDealId } = useParams()
    const navigate = useNavigate()

    const [checkingAdmin, setCheckingAdmin] = useState(true)
    // 관리자 권한 확인 중인지 관리

    const [isAdmin, setIsAdmin] = useState(false)
    // 관리자 여부

    const [hotDeal, setHotDeal] = useState<AdminHotDealDetail | null>(null)
    // 서버에서 받아온 핫딜 상세 데이터

    const [loading, setLoading] = useState(true)
    // 핫딜 상세 조회 중인지 관리

    const [error, setError] = useState('')
    // 핫딜 상세 조회 실패 메세지

    const [submitting, setSubmitting] = useState(false)
    // 핫딜 수정 요청 중인지 관리

    const [form, setForm] = useState<HotDealForm>({
        hotDealPrice: '',
        hotDealStock: '',

        startDate: '',
        startMeridiem: 'AM',
        startHour: '01',
        startMinute: '00',

        endDate: '',
        endMeridiem: 'AM',
        endHour: '01',
        endMinute: '00',
    })
    // 핫딜 수정 폼 값

    const discountRate = useMemo(() => {
        if (!hotDeal) {
            return 0
        }

        const hotDealPrice = Number(form.hotDealPrice)

        if (Number.isNaN(hotDealPrice) || hotDealPrice <= 0) {
            return 0
        }

        if (hotDealPrice >= hotDeal.originalPrice) {
            return 0
        }

        return Math.round(
            ((hotDeal.originalPrice - hotDealPrice) / hotDeal.originalPrice) * 100,
        )
    }, [hotDeal, form.hotDealPrice])

    // 관리자 권한 확인
    useEffect(() => {
        async function checkAdmin() {
            try {
                const response = await axios.get<MemberInfo | null>(
                    `${API_BASE_URL}/member/myinfo`,
                    {
                        withCredentials: true,
                    },
                )

                setIsAdmin(response.data?.role === 'ADMIN')
            } catch (error) {
                setIsAdmin(false)
            } finally {
                setCheckingAdmin(false)
            }
        }

        void checkAdmin()
    }, [])

    // 수정할 핫딜 상세 조회
    useEffect(() => {
        async function loadHotDealDetail() {
            if (!hotDealId) {
                setError('잘못된 접근입니다.')
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError('')

                const data = await fetchAdminHotDealDetail(hotDealId)

                const start = parseDateTimeToFormParts(data.startTime)
                const end = parseDateTimeToFormParts(data.endTime)

                setHotDeal(data)

                setForm({
                    hotDealPrice: String(data.hotDealPrice),
                    hotDealStock: String(data.hotDealStock),

                    startDate: start.date,
                    startMeridiem: start.meridiem,
                    startHour: start.hour,
                    startMinute: start.minute,

                    endDate: end.date,
                    endMeridiem: end.meridiem,
                    endHour: end.hour,
                    endMinute: end.minute,
                })
            } catch (error) {
                setError(getErrorMessage(error))
            } finally {
                setLoading(false)
            }
        }

        void loadHotDealDetail()
    }, [hotDealId])

    function handleChange<K extends keyof HotDealForm>(
        field: K,
        value: HotDealForm[K],
    ) {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    function validateForm() {
        if (!hotDeal) {
            alert('수정할 핫딜 정보를 찾을 수 없습니다.')
            return false
        }

        const hotDealPrice = Number(form.hotDealPrice)

        if (!form.hotDealPrice.trim() || Number.isNaN(hotDealPrice) || hotDealPrice <= 0) {
            alert('핫딜 가격은 1 이상 숫자로 입력해주세요.')
            return false
        }

        if (hotDealPrice >= hotDeal.originalPrice) {
            alert('핫딜 가격은 원가보다 낮아야 합니다.')
            return false
        }

        const hotDealStock = Number(form.hotDealStock)

        if (!form.hotDealStock.trim() || Number.isNaN(hotDealStock) || hotDealStock <= 0) {
            alert('핫딜 재고는 1 이상 숫자로 입력해주세요.')
            return false
        }

        if (!form.startDate) {
            alert('핫딜 시작 날짜를 입력해주세요.')
            return false
        }

        if (!form.endDate) {
            alert('핫딜 종료 날짜를 입력해주세요.')
            return false
        }

        const startDate = buildDateObject(
            form.startDate,
            form.startMeridiem,
            form.startHour,
            form.startMinute,
        )

        const endDate = buildDateObject(
            form.endDate,
            form.endMeridiem,
            form.endHour,
            form.endMinute,
        )

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            alert('핫딜 시작/종료 시간이 올바르지 않습니다.')
            return false
        }

        if (endDate.getTime() <= startDate.getTime()) {
            alert('핫딜 종료 시간은 시작 시간보다 뒤여야 합니다.')
            return false
        }

        return true
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (!hotDealId) {
            alert('수정할 핫딜 정보를 찾을 수 없습니다.')
            return
        }

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)

            await updateAdminHotDeal(hotDealId, {
                hotDealPrice: Number(form.hotDealPrice),
                hotDealStock: Number(form.hotDealStock),
                startTime: buildRequestDateTime(
                    form.startDate,
                    form.startMeridiem,
                    form.startHour,
                    form.startMinute,
                ),
                endTime: buildRequestDateTime(
                    form.endDate,
                    form.endMeridiem,
                    form.endHour,
                    form.endMinute,
                ),
            })

            alert('핫딜이 수정되었습니다.')
            navigate('/admin/hotdeals')
        } catch (error) {
            alert(getErrorMessage(error))
        } finally {
            setSubmitting(false)
        }
    }

    if (checkingAdmin) {
        return (
            <div className="admin-hotdeal-form-page">
                <SiteHeader />

                <main className="admin-hotdeal-form-container">
                    <div className="admin-hotdeal-form-state-box">
                        관리자 권한을 확인하는 중입니다...
                    </div>
                </main>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="admin-hotdeal-form-page">
                <SiteHeader />

                <main className="admin-hotdeal-form-container">
                    <div className="admin-hotdeal-form-state-box">
                        관리자만 핫딜을 수정할 수 있습니다.
                    </div>

                    <div className="admin-hotdeal-form-button-row">
                        <button
                            type="button"
                            className="admin-hotdeal-form-secondary-button"
                            onClick={() => navigate('/')}
                        >
                            홈으로 돌아가기
                        </button>
                    </div>
                </main>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="admin-hotdeal-form-page">
                <SiteHeader />

                <main className="admin-hotdeal-form-container">
                    <div className="admin-hotdeal-form-state-box">
                        핫딜 정보를 불러오는 중입니다...
                    </div>
                </main>
            </div>
        )
    }

    if (error) {
        return (
            <div className="admin-hotdeal-form-page">
                <SiteHeader />

                <main className="admin-hotdeal-form-container">
                    <div className="admin-hotdeal-form-state-box">{error}</div>

                    <div className="admin-hotdeal-form-button-row">
                        <button
                            type="button"
                            className="admin-hotdeal-form-secondary-button"
                            onClick={() => navigate('/admin/hotdeals')}
                        >
                            목록으로 돌아가기
                        </button>
                    </div>
                </main>
            </div>
        )
    }

    if (!hotDeal) {
        return (
            <div className="admin-hotdeal-form-page">
                <SiteHeader />

                <main className="admin-hotdeal-form-container">
                    <div className="admin-hotdeal-form-state-box">
                        핫딜 정보를 찾을 수 없습니다.
                    </div>

                    <div className="admin-hotdeal-form-button-row">
                        <button
                            type="button"
                            className="admin-hotdeal-form-secondary-button"
                            onClick={() => navigate('/admin/hotdeals')}
                        >
                            목록으로 돌아가기
                        </button>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="admin-hotdeal-form-page">
            <SiteHeader />

            <main className="admin-hotdeal-form-container">
                <section className="admin-hotdeal-form-header">
                    <p className="admin-hotdeal-form-eyebrow">ADMIN HOTDEAL</p>
                    <h1 className="admin-hotdeal-form-title">핫딜 수정</h1>
                    <p className="admin-hotdeal-form-description">
                        등록된 핫딜의 가격, 재고, 운영 기간을 수정합니다.
                    </p>
                </section>

                <form className="admin-hotdeal-form-card" onSubmit={handleSubmit}>
                    <div className="admin-hotdeal-form-row">
                        <label className="admin-hotdeal-form-label">원본 상품</label>

                        <div className="admin-hotdeal-form-field">
                            <div className="admin-hotdeal-form-readonly-box">
                                {hotDeal.productName}
                            </div>
                        </div>
                    </div>

                    <div className="admin-hotdeal-form-row">
                        <label className="admin-hotdeal-form-label">상태</label>

                        <div className="admin-hotdeal-form-field">
                            <div className="admin-hotdeal-form-readonly-box">
                                {getHotDealStatusLabel(hotDeal.status)}
                            </div>
                        </div>
                    </div>

                    <div className="admin-hotdeal-form-row">
                        <label className="admin-hotdeal-form-label">핫딜가</label>

                        <div className="admin-hotdeal-form-field">
                            <input
                                className="admin-hotdeal-form-input"
                                type="number"
                                min={1}
                                value={form.hotDealPrice}
                                onChange={(e) => handleChange('hotDealPrice', e.target.value)}
                                placeholder="핫딜 가격을 입력해주세요."
                            />
                        </div>
                    </div>

                    <div className="admin-hotdeal-form-row">
                        <label className="admin-hotdeal-form-label">핫딜 재고</label>

                        <div className="admin-hotdeal-form-field">
                            <input
                                className="admin-hotdeal-form-input"
                                type="number"
                                min={1}
                                value={form.hotDealStock}
                                onChange={(e) => handleChange('hotDealStock', e.target.value)}
                                placeholder="핫딜 재고를 입력해주세요."
                            />
                        </div>
                    </div>

                    <div className="admin-hotdeal-form-row">
                        <label className="admin-hotdeal-form-label">시작 시간</label>

                        <div className="admin-hotdeal-form-field">
                            <HotDealTimeInput
                                dateValue={form.startDate}
                                meridiem={form.startMeridiem}
                                hour={form.startHour}
                                minute={form.startMinute}
                                onDateChange={(value) => handleChange('startDate', value)}
                                onMeridiemChange={(value) =>
                                    handleChange('startMeridiem', value)
                                }
                                onHourChange={(value) => handleChange('startHour', value)}
                                onMinuteChange={(value) => handleChange('startMinute', value)}
                            />
                        </div>
                    </div>

                    <div className="admin-hotdeal-form-row">
                        <label className="admin-hotdeal-form-label">종료 시간</label>

                        <div className="admin-hotdeal-form-field">
                            <HotDealTimeInput
                                dateValue={form.endDate}
                                meridiem={form.endMeridiem}
                                hour={form.endHour}
                                minute={form.endMinute}
                                onDateChange={(value) => handleChange('endDate', value)}
                                onMeridiemChange={(value) =>
                                    handleChange('endMeridiem', value)
                                }
                                onHourChange={(value) => handleChange('endHour', value)}
                                onMinuteChange={(value) => handleChange('endMinute', value)}
                            />
                        </div>
                    </div>

                    <div className="admin-hotdeal-preview-card">
                        <p className="admin-hotdeal-preview-title">핫딜 미리보기</p>

                        <div className="admin-hotdeal-preview-content">
                            <div className="admin-hotdeal-preview-image">
                                {hotDeal.imageUrl ? (
                                    <img
                                        src={hotDeal.imageUrl}
                                        alt={hotDeal.productName}
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none'
                                        }}
                                    />
                                ) : (
                                    <span>상품</span>
                                )}
                            </div>

                            <div className="admin-hotdeal-preview-info">
                                <strong>{hotDeal.productName}</strong>

                                <p>
                                    원가 {formatPrice(hotDeal.originalPrice)}
                                    {' · '}
                                    핫딜가{' '}
                                    {form.hotDealPrice
                                        ? formatPrice(Number(form.hotDealPrice))
                                        : '-'}
                                </p>

                                <p>
                                    할인율 {discountRate}%
                                    {' · '}
                                    핫딜 재고 {form.hotDealStock || '-'}개
                                    {' · '}
                                    현재 상태 {getHotDealStatusLabel(hotDeal.status)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="admin-hotdeal-form-button-row admin-hotdeal-form-button-row--right">
                        <button
                            type="button"
                            className="admin-hotdeal-form-secondary-button"
                            onClick={() => navigate('/admin/hotdeals')}
                        >
                            취소
                        </button>

                        <button
                            type="submit"
                            className="admin-hotdeal-form-primary-button"
                            disabled={submitting}
                        >
                            {submitting ? '수정 중...' : '핫딜 수정'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    )
}