import { type FormEvent, useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import './ReviewCreatePage.css'

const API_BASE_URL = 'http://localhost:8080'

type ProductDetail = {
    id: number
    category: string
    imageUrl: string | null
    name: string
    description: string
    price: number
    status: string
}

type ReviewForm = {
    rating: number
    title: string
    content: string
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

    return '리뷰 등록에 실패했습니다.'
}

function formatPrice(price: number) {
    return `${price.toLocaleString('ko-KR')}원`
}

export default function ReviewCreatePage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const productId = searchParams.get('productId')
    const orderItemId = searchParams.get('orderItemId')

    const [product, setProduct] = useState<ProductDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const [form, setForm] = useState<ReviewForm>({
        rating: 5,
        title: '',
        content: '',
    })

    useEffect(() => {
        async function loadProduct() {
            if (!productId || !orderItemId) {
                setErrorMessage('리뷰 작성에 필요한 주문상품 정보가 없습니다.')
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setErrorMessage('')

                const response = await axios.get<ProductDetail>(
                    `${API_BASE_URL}/products/${productId}`,
                    {
                        withCredentials: true,
                    },
                )

                setProduct(response.data)
            } catch (error) {
                setErrorMessage('상품 정보를 불러오지 못했습니다.')
            } finally {
                setLoading(false)
            }
        }

        void loadProduct()
    }, [productId, orderItemId])

    function handleChange(field: keyof ReviewForm, value: string | number) {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (!productId || !orderItemId) {
            alert('리뷰 작성에 필요한 주문상품 정보가 없습니다.')
            return
        }

        if (!form.title.trim()) {
            alert('리뷰 제목을 입력해주세요.')
            return
        }

        if (!form.content.trim()) {
            alert('리뷰 내용을 입력해주세요.')
            return
        }

        try {
            setSubmitting(true)

            await axios.post(
                `${API_BASE_URL}/products/${productId}/reviews`,
                {
                    orderItemId: Number(orderItemId),
                    rating: form.rating,
                    title: form.title,
                    content: form.content,
                },
                {
                    withCredentials: true,
                },
            )

            alert('리뷰가 등록되었습니다.')
            navigate('/mypage/reviews')
        } catch (error) {
            alert(getErrorMessage(error))
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="review-create-page">
                <SiteHeader />
                <main className="review-create-page__content">
                    <div className="review-create-page__state-box">
                        리뷰 작성 정보를 불러오는 중입니다...
                    </div>
                </main>
            </div>
        )
    }

    if (errorMessage || !product) {
        return (
            <div className="review-create-page">
                <SiteHeader />
                <main className="review-create-page__content">
                    <div className="review-create-page__state-box">
                        {errorMessage || '상품 정보를 불러오지 못했습니다.'}
                    </div>
                    <div className="review-create-page__button-row">
                        <button
                            type="button"
                            className="review-create-page__secondary-button"
                            onClick={() => navigate('/mypage/orders')}
                        >
                            주문목록으로 돌아가기
                        </button>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="review-create-page">
            <SiteHeader />

            <main className="review-create-page__content">
                <section className="review-create-page__header">
                    <p className="review-create-page__eyebrow">REVIEW</p>
                    <h1 className="review-create-page__title">리뷰 작성</h1>
                    <p className="review-create-page__description">
                        구매한 상품에 대한 후기를 작성해주세요.
                    </p>
                </section>

                <section className="review-create-page__product-card">
                    <div className="review-create-page__product-image-box">
                        <span className="review-create-page__product-emoji">🎁</span>
                    </div>

                    <div className="review-create-page__product-info">
                        <h2>{product.name}</h2>
                        <p>{product.description}</p>
                        <strong>{formatPrice(product.price)}</strong>
                    </div>
                </section>

                <form className="review-create-form" onSubmit={handleSubmit}>
                    <section className="review-create-form__card">
                        <div className="review-create-form__row">
                            <label className="review-create-form__label">별점</label>
                            <div className="review-create-form__field">
                                <div className="review-create-form__star-row">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={
                                                star <= form.rating
                                                    ? 'review-create-form__star review-create-form__star--active'
                                                    : 'review-create-form__star'
                                            }
                                            onClick={() => handleChange('rating', star)}
                                        >
                                            ★
                                        </button>
                                    ))}
                                    <span className="review-create-form__rating-text">
                                        {form.rating}점
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="review-create-form__row">
                            <label className="review-create-form__label">제목</label>
                            <div className="review-create-form__field">
                                <input
                                    className="review-create-form__input"
                                    value={form.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    placeholder="리뷰 제목을 입력해주세요."
                                    maxLength={100}
                                />
                            </div>
                        </div>

                        <div className="review-create-form__row review-create-form__row--textarea">
                            <label className="review-create-form__label">내용</label>
                            <div className="review-create-form__field">
                                <textarea
                                    className="review-create-form__textarea"
                                    value={form.content}
                                    onChange={(e) => handleChange('content', e.target.value)}
                                    placeholder="상품을 사용해본 느낌을 자세히 작성해주세요."
                                    maxLength={2000}
                                />
                                <p className="review-create-form__help-text">
                                    {form.content.length.toLocaleString('ko-KR')} / 2,000자
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="review-create-page__button-row review-create-page__button-row--right">
                        <button
                            type="button"
                            className="review-create-page__secondary-button"
                            onClick={() => navigate('/mypage/orders')}
                        >
                            취소
                        </button>

                        <button
                            type="submit"
                            className="review-create-page__primary-button"
                            disabled={submitting}
                        >
                            {submitting ? '등록 중...' : '리뷰 등록'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    )
}