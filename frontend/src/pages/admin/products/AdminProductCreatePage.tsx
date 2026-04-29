import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../../../components/SiteHeader.tsx'
import {
    createAdminProduct,
    type ProductCategoryCode,
    uploadAdminImage,
} from '../../../api/adminProductApi.ts'
import './AdminProductFormPage.css'

const API_BASE_URL = 'http://localhost:8080'

type MemberInfo = {
    id: number
    loginId?: string
    name?: string
    nickname?: string
    role?: 'ADMIN' | 'USER'
}

type ProductForm = {
    name: string
    description: string
    imageUrl: string
    detailImageUrl: string
    price: string
    stock: string
    category: ProductCategoryCode | ''
}

type ImageUploadTarget = 'imageUrl' | 'detailImageUrl'

const PRODUCT_CATEGORY_OPTIONS: {
    value: ProductCategoryCode
    label: string
}[] = [
    { value: 'FOOD', label: '식품' },
    { value: 'LIFE', label: '생활' },
    { value: 'ELECTRONICS', label: '가전' },
    { value: 'BEAUTY', label: '뷰티' },
    { value: 'FASHION', label: '패션' },
    { value: 'BOOK', label: '도서' },
]

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

    return '상품 등록에 실패했습니다.'
}

function getUploadErrorMessage(error: unknown) {
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

    return '이미지 업로드에 실패했습니다.'
}

export default function AdminProductCreatePage() {
    const navigate = useNavigate()

    const [checkingAdmin, setCheckingAdmin] = useState(true)
    // 관리자 권한 확인 중인지 관리

    const [isAdmin, setIsAdmin] = useState(false)
    // 관리자 여부

    const [submitting, setSubmitting] = useState(false)
    // 상품 등록 요청 중인지 관리. 중복 클릭 방지용.

    const [uploadingTarget, setUploadingTarget] = useState<ImageUploadTarget | null>(null)
    // 현재 업로드 중인 이미지 위치. 대표 이미지인지 상세 설명 이미지인지 구분.

    const [form, setForm] = useState<ProductForm>({
        name: '',
        description: '',
        imageUrl: '',
        detailImageUrl: '',
        price: '',
        stock: '',
        category: '',
    })
    // 상품 등록 폼 값

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

    function handleChange(field: keyof ProductForm, value: string) {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    async function handleImageUpload(
        target: ImageUploadTarget,
        e: ChangeEvent<HTMLInputElement>,
    ) {
        const file = e.target.files?.[0]

        // 같은 파일을 다시 선택해도 change 이벤트가 다시 발생할 수 있게 비워둠.
        e.target.value = ''

        if (!file) {
            return
        }

        try {
            setUploadingTarget(target)

            const uploadedImageUrl = await uploadAdminImage(file)

            setForm((prev) => ({
                ...prev,
                [target]: uploadedImageUrl,
            }))

            alert(
                target === 'imageUrl'
                    ? '대표 이미지가 업로드되었습니다.'
                    : '상세 설명 이미지가 업로드되었습니다.',
            )
        } catch (error) {
            alert(getUploadErrorMessage(error))
        } finally {
            setUploadingTarget(null)
        }
    }

    function validateForm() {
        if (!form.name.trim()) {
            alert('상품 이름을 입력해주세요.')
            return false
        }

        if (!form.description.trim()) {
            alert('상품 설명을 입력해주세요.')
            return false
        }

        if (!form.imageUrl.trim()) {
            alert('대표 이미지를 업로드해주세요.')
            return false
        }

        if (!form.detailImageUrl.trim()) {
            alert('상세 설명 이미지를 업로드해주세요.')
            return false
        }

        if (!form.price.trim()) {
            alert('상품 가격을 입력해주세요.')
            return false
        }

        const price = Number(form.price)

        if (Number.isNaN(price) || price <= 0) {
            alert('상품 가격은 1 이상 숫자로 입력해주세요.')
            return false
        }

        if (!form.stock.trim()) {
            alert('상품 재고를 입력해주세요.')
            return false
        }

        const stock = Number(form.stock)

        if (Number.isNaN(stock) || stock <= 0) {
            alert('상품 재고는 1 이상 숫자로 입력해주세요.')
            return false
        }

        if (!form.category) {
            alert('상품 카테고리를 선택해주세요.')
            return false
        }

        return true
    }

    // 상품 등록
    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)

            await createAdminProduct({
                name: form.name.trim(),
                description: form.description.trim(),
                imageUrl: form.imageUrl.trim(),
                detailImageUrl: form.detailImageUrl.trim(),
                price: Number(form.price),
                stock: Number(form.stock),
                category: form.category as ProductCategoryCode,
            })

            alert('상품이 등록되었습니다.')
            navigate('/admin/products')
        } catch (error) {
            alert(getErrorMessage(error))
        } finally {
            setSubmitting(false)
        }
    }

    if (checkingAdmin) {
        return (
            <div className="admin-product-form-page">
                <SiteHeader />

                <main className="admin-product-form-container">
                    <div className="admin-product-form-state-box">
                        관리자 권한을 확인하는 중입니다...
                    </div>
                </main>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="admin-product-form-page">
                <SiteHeader />

                <main className="admin-product-form-container">
                    <div className="admin-product-form-state-box">
                        관리자만 상품을 등록할 수 있습니다.
                    </div>

                    <div className="admin-product-form-button-row">
                        <button
                            type="button"
                            className="admin-product-form-secondary-button"
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
        <div className="admin-product-form-page">
            <SiteHeader />

            <main className="admin-product-form-container">
                <section className="admin-product-form-header">
                    <p className="admin-product-form-eyebrow">ADMIN PRODUCT</p>
                    <h1 className="admin-product-form-title">상품 등록</h1>
                    <p className="admin-product-form-description">
                        쇼핑몰에 노출할 일반 상품 정보를 입력해주세요.
                    </p>
                </section>

                <form className="admin-product-form-card" onSubmit={handleSubmit}>
                    <div className="admin-product-form-row">
                        <label className="admin-product-form-label">상품명</label>

                        <div className="admin-product-form-field">
                            <input
                                className="admin-product-form-input"
                                value={form.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="상품명을 입력해주세요."
                            />
                        </div>
                    </div>

                    <div className="admin-product-form-row admin-product-form-row--textarea">
                        <label className="admin-product-form-label">상품 설명</label>

                        <div className="admin-product-form-field">
                            <textarea
                                className="admin-product-form-textarea"
                                value={form.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="상품 설명을 입력해주세요."
                            />
                        </div>
                    </div>

                    <div className="admin-product-form-row admin-product-form-row--image">
                        <label className="admin-product-form-label">대표 이미지</label>

                        <div className="admin-product-form-field">
                            <div className="admin-product-image-upload-box">
                                <div className="admin-product-image-preview">
                                    {form.imageUrl.trim() ? (
                                        <img
                                            src={form.imageUrl}
                                            alt={form.name || '대표 이미지'}
                                        />
                                    ) : (
                                        <span>대표 이미지 없음</span>
                                    )}
                                </div>

                                <div className="admin-product-image-upload-info">
                                    <label className="admin-product-image-upload-button">
                                        {uploadingTarget === 'imageUrl'
                                            ? '업로드 중...'
                                            : form.imageUrl
                                                ? '대표 이미지 교체'
                                                : '대표 이미지 업로드'}

                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload('imageUrl', e)}
                                            disabled={uploadingTarget !== null}
                                        />
                                    </label>

                                    {form.imageUrl && (
                                        <p className="admin-product-image-url-text">
                                            업로드 완료
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="admin-product-form-row admin-product-form-row--image">
                        <label className="admin-product-form-label">상세 설명 이미지</label>

                        <div className="admin-product-form-field">
                            <div className="admin-product-image-upload-box">
                                <div className="admin-product-image-preview admin-product-image-preview--detail">
                                    {form.detailImageUrl.trim() ? (
                                        <img
                                            src={form.detailImageUrl}
                                            alt={form.name || '상세 설명 이미지'}
                                        />
                                    ) : (
                                        <span>상세 설명 이미지 없음</span>
                                    )}
                                </div>

                                <div className="admin-product-image-upload-info">
                                    <label className="admin-product-image-upload-button">
                                        {uploadingTarget === 'detailImageUrl'
                                            ? '업로드 중...'
                                            : form.detailImageUrl
                                                ? '상세 이미지 교체'
                                                : '상세 이미지 업로드'}

                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) =>
                                                handleImageUpload('detailImageUrl', e)
                                            }
                                            disabled={uploadingTarget !== null}
                                        />
                                    </label>

                                    {form.detailImageUrl && (
                                        <p className="admin-product-image-url-text">
                                            업로드 완료
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="admin-product-form-row">
                        <label className="admin-product-form-label">가격</label>

                        <div className="admin-product-form-field">
                            <input
                                className="admin-product-form-input"
                                type="number"
                                min={1}
                                value={form.price}
                                onChange={(e) => handleChange('price', e.target.value)}
                                placeholder="상품 가격을 입력해주세요."
                            />
                        </div>
                    </div>

                    <div className="admin-product-form-row">
                        <label className="admin-product-form-label">재고</label>

                        <div className="admin-product-form-field">
                            <input
                                className="admin-product-form-input"
                                type="number"
                                min={1}
                                value={form.stock}
                                onChange={(e) => handleChange('stock', e.target.value)}
                                placeholder="상품 재고를 입력해주세요."
                            />
                        </div>
                    </div>

                    <div className="admin-product-form-row">
                        <label className="admin-product-form-label">카테고리</label>

                        <div className="admin-product-form-field">
                            <select
                                className="admin-product-form-select"
                                value={form.category}
                                onChange={(e) => handleChange('category', e.target.value)}
                            >
                                <option value="">카테고리를 선택해주세요.</option>

                                {PRODUCT_CATEGORY_OPTIONS.map((category) => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="admin-product-form-preview-card">
                        <p className="admin-product-form-preview-title">등록 미리보기</p>

                        <div className="admin-product-form-preview-content">
                            <div className="admin-product-form-preview-image">
                                {form.imageUrl.trim() ? (
                                    <img
                                        src={form.imageUrl}
                                        alt={form.name || '대표 이미지'}
                                    />
                                ) : (
                                    <span>이미지</span>
                                )}
                            </div>

                            <div className="admin-product-form-preview-info">
                                <strong>{form.name || '상품명'}</strong>
                                <p>{form.description || '상품 설명이 표시됩니다.'}</p>
                                <span>
                                    {form.price
                                        ? `${Number(form.price).toLocaleString('ko-KR')}원`
                                        : '가격'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="admin-product-form-button-row admin-product-form-button-row--right">
                        <button
                            type="button"
                            className="admin-product-form-secondary-button"
                            onClick={() => navigate('/admin/products')}
                        >
                            취소
                        </button>

                        <button
                            type="submit"
                            className="admin-product-form-primary-button"
                            disabled={submitting || uploadingTarget !== null}
                        >
                            {submitting ? '등록 중...' : '상품 등록'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    )
}