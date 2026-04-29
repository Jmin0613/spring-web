import { type FormEvent, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../../../components/SiteHeader.tsx'
import {
    fetchAdminProducts,
    type AdminProductListItem,
} from '../../../api/adminProductApi.ts'
import { createAdminHotDeal } from '../../../api/adminHotDealApi.ts'
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
    productId: string
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

function getProductId(product: AdminProductListItem) {
    return product.productId ?? product.id
}

function formatPrice(price: number) {
    return `${price.toLocaleString('ko-KR')}원`
}

function toDateInputValue(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function toMeridiem(date: Date): Meridiem {
    return date.getHours() < 12 ? 'AM' : 'PM'
}

function toHour12Value(date: Date) {
    const hour = date.getHours()
    const hour12 = hour % 12 === 0 ? 12 : hour % 12

    return String(hour12).padStart(2, '0')
}

function toMinuteValue(date: Date) {
    return String(date.getMinutes()).padStart(2, '0')
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

function createDefaultHotDealForm(): HotDealForm {
    const now = new Date()
    const startDate = new Date(now.getTime() + 60 * 60 * 1000)
    const endDate = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    return {
        productId: '',
        hotDealPrice: '',
        hotDealStock: '',

        startDate: toDateInputValue(startDate),
        startMeridiem: toMeridiem(startDate),
        startHour: toHour12Value(startDate),
        startMinute: toMinuteValue(startDate),

        endDate: toDateInputValue(endDate),
        endMeridiem: toMeridiem(endDate),
        endHour: toHour12Value(endDate),
        endMinute: toMinuteValue(endDate),
    }
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

    return '핫딜 등록에 실패했습니다.'
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

export default function AdminHotDealCreatePage() {
    const navigate = useNavigate()

    const [checkingAdmin, setCheckingAdmin] = useState(true)
    // 관리자 권한 확인 중인지 관리

    const [isAdmin, setIsAdmin] = useState(false)
    // 관리자 여부

    const [products, setProducts] = useState<AdminProductListItem[]>([])
    // 핫딜 원본 상품 후보 목록

    const [productsLoading, setProductsLoading] = useState(true)
    // 상품 목록 조회 중인지 관리

    const [productsError, setProductsError] = useState('')
    // 상품 목록 조회 실패 메세지

    const [submitting, setSubmitting] = useState(false)
    // 핫딜 등록 요청 중인지 관리. 중복 클릭 방지용.

    const [form, setForm] = useState<HotDealForm>(() => createDefaultHotDealForm())
    // 핫딜 등록 폼 값

    const availableProducts = useMemo(() => {
        return products.filter((product) => {
            const productId = getProductId(product)

            return !!productId && product.status === 'ON_SALE' && product.stock > 0
        })
    }, [products])

    const selectedProduct = useMemo(() => {
        if (!form.productId) {
            return null
        }

        const selectedId = Number(form.productId)

        return (
            availableProducts.find((product) => getProductId(product) === selectedId) ??
            null
        )
    }, [availableProducts, form.productId])

    const discountRate = useMemo(() => {
        if (!selectedProduct) {
            return 0
        }

        const hotDealPrice = Number(form.hotDealPrice)

        if (Number.isNaN(hotDealPrice) || hotDealPrice <= 0) {
            return 0
        }

        if (hotDealPrice >= selectedProduct.price) {
            return 0
        }

        return Math.round(
            ((selectedProduct.price - hotDealPrice) / selectedProduct.price) * 100,
        )
    }, [selectedProduct, form.hotDealPrice])

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

    // 핫딜 원본 상품 목록 조회
    useEffect(() => {
        async function loadProducts() {
            try {
                setProductsLoading(true)
                setProductsError('')

                const data = await fetchAdminProducts()
                setProducts(data)
            } catch (error) {
                setProductsError(getErrorMessage(error))
            } finally {
                setProductsLoading(false)
            }
        }

        void loadProducts()
    }, [])

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
        if (!form.productId) {
            alert('핫딜로 등록할 원본 상품을 선택해주세요.')
            return false
        }

        if (!selectedProduct) {
            alert('선택한 상품 정보를 찾을 수 없습니다.')
            return false
        }

        const hotDealPrice = Number(form.hotDealPrice)

        if (!form.hotDealPrice.trim() || Number.isNaN(hotDealPrice) || hotDealPrice <= 0) {
            alert('핫딜 가격은 1 이상 숫자로 입력해주세요.')
            return false
        }

        if (hotDealPrice >= selectedProduct.price) {
            alert('핫딜 가격은 원가보다 낮아야 합니다.')
            return false
        }

        const hotDealStock = Number(form.hotDealStock)

        if (!form.hotDealStock.trim() || Number.isNaN(hotDealStock) || hotDealStock <= 0) {
            alert('핫딜 재고는 1 이상 숫자로 입력해주세요.')
            return false
        }

        if (hotDealStock > selectedProduct.stock) {
            alert('핫딜 재고는 원본 상품의 현재 재고보다 많을 수 없습니다.')
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

        const nowDate = new Date()

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            alert('핫딜 시작/종료 시간이 올바르지 않습니다.')
            return false
        }

        if (startDate.getTime() < nowDate.getTime()) {
            alert('핫딜 시작 시간은 현재 이후여야 합니다.')
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

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)

            await createAdminHotDeal({
                productId: Number(form.productId),
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

            alert('핫딜이 등록되었습니다.')
            navigate('/admin')
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
                        관리자만 핫딜을 등록할 수 있습니다.
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

    return (
        <div className="admin-hotdeal-form-page">
            <SiteHeader />

            <main className="admin-hotdeal-form-container">
                <section className="admin-hotdeal-form-header">
                    <p className="admin-hotdeal-form-eyebrow">ADMIN HOTDEAL</p>
                    <h1 className="admin-hotdeal-form-title">핫딜 등록</h1>
                    <p className="admin-hotdeal-form-description">
                        일반 상품의 일부 재고를 핫딜 재고로 할당하고 특가 기간을 설정합니다.
                    </p>
                </section>

                {productsLoading ? (
                    <div className="admin-hotdeal-form-state-box">
                        상품 목록을 불러오는 중입니다...
                    </div>
                ) : productsError ? (
                    <div className="admin-hotdeal-form-state-box">{productsError}</div>
                ) : availableProducts.length === 0 ? (
                    <div className="admin-hotdeal-form-state-box">
                        핫딜로 등록할 수 있는 판매중 상품이 없습니다.
                    </div>
                ) : (
                    <form className="admin-hotdeal-form-card" onSubmit={handleSubmit}>
                        <div className="admin-hotdeal-form-row">
                            <label className="admin-hotdeal-form-label">원본 상품</label>

                            <div className="admin-hotdeal-form-field">
                                <select
                                    className="admin-hotdeal-form-select"
                                    value={form.productId}
                                    onChange={(e) => handleChange('productId', e.target.value)}
                                >
                                    <option value="">핫딜로 등록할 상품을 선택해주세요.</option>

                                    {availableProducts.map((product) => {
                                        const productId = getProductId(product)

                                        if (!productId) {
                                            return null
                                        }

                                        return (
                                            <option key={productId} value={productId}>
                                                {product.name} / {product.category} / 재고{' '}
                                                {product.stock}개 / 원가{' '}
                                                {formatPrice(product.price)}
                                            </option>
                                        )
                                    })}
                                </select>
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
                                    max={selectedProduct?.stock ?? undefined}
                                    value={form.hotDealStock}
                                    onChange={(e) => handleChange('hotDealStock', e.target.value)}
                                    placeholder="핫딜로 할당할 재고를 입력해주세요."
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

                            {selectedProduct ? (
                                <div className="admin-hotdeal-preview-content">
                                    <div className="admin-hotdeal-preview-image">
                                        {selectedProduct.imageUrl ? (
                                            <img
                                                src={selectedProduct.imageUrl}
                                                alt={selectedProduct.name}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none'
                                                }}
                                            />
                                        ) : (
                                            <span>상품</span>
                                        )}
                                    </div>

                                    <div className="admin-hotdeal-preview-info">
                                        <strong>{selectedProduct.name}</strong>

                                        <p>
                                            원가 {formatPrice(selectedProduct.price)}
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
                                            원본 재고 {selectedProduct.stock}개
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="admin-hotdeal-preview-empty">
                                    상품을 선택하면 핫딜 미리보기가 표시됩니다.
                                </div>
                            )}
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
                                {submitting ? '등록 중...' : '핫딜 등록'}
                            </button>
                        </div>
                    </form>
                )}
            </main>
        </div>
    )
}