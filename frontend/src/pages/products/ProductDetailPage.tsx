import { useEffect, useMemo, useState } from 'react'

import axios from 'axios'

import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import SiteHeader from '../../components/SiteHeader.tsx'

import './ProductDetailPage.css'

type ProductDetail = {
    id: number
    category: string
    imageUrl: string | null
    detailImageUrl: string | null
    name: string
    description: string
    price: number
    stock?: number | null
    status: string
}

type WishlistListItem = {
    productId: number
}

type ProductActionType = 'wishlist' | 'cart' | null

type WriterLabelTarget = ProductInquiryListItem | ProductInquiryDetailItem | ProductReviewItem

type ReviewSortType = 'BEST' | 'LATEST'

type ReviewSummary = {
    averageRating: number
    totalCount: number
    fiveStarCount: number
    fourStarCount: number
    threeStarCount: number
    twoStarCount: number
    oneStarCount: number
}

type ProductReviewItem = {
    reviewId: number
    writerNickName?: string
    rating: number
    title: string
    content: string
    createdAt: string
    likeCount?: number
    likedByCurrentUser?: boolean
    productNameSnapshot?: string
    quantity?: number
}

type ReviewPageResponse = {
    summary: ReviewSummary
    reviews: ProductReviewItem[]
    page: number
    size: number
    totalElements: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
}

type ReviewLikeToggleResponse = {
    reviewId: number
    liked: boolean
    likeCount: number
}

type ProductInquiryListItem = {
    id: number
    title: string
    writerNickName?: string
    writerId?: number
    status: 'WAITING' | 'ANSWERED'
    createdAt: string
    secret?: boolean
}

type ProductInquiryDetailItem = {
    inquiryId: number
    productId: number
    productNameSnapshot: string
    title: string
    content: string
    answerContent: string | null
    status: 'WAITING' | 'ANSWERED'
    createdAt: string
    answeredAt?: string | null
    updatedAt?: string
    writerNickName?: string
}

type MemberInfo = {
    id: number
    nickName?: string
    name?: string
}

type ProductDetailTab = 'detail' | 'review' | 'inquiry'

const API_BASE_URL = '/api'
const PAGE_SIZE = 10

function formatPrice(price: number) {
    return `${price.toLocaleString('ko-KR')}원`
}

function getStatusLabel(status: string) {
    if (status === 'ON_SALE') return '판매중'
    if (status === 'SOLD_OUT') return '품절'
    if (status === 'HIDDEN') return '숨김'
    return status
}

function getInquiryStatusLabel(status: 'WAITING' | 'ANSWERED') {
    if (status === 'ANSWERED') return '답변완료'
    return '답변대기'
}

function formatInquiryDate(dateTime: string) {
    return dateTime.slice(0, 10).replaceAll('-', '.')
}

function formatReviewDate(dateTime: string) {
    return dateTime.slice(0, 10).replaceAll('-', '.')
}

function renderStars(rating: number) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

function getRatingPercent(count: number, total: number) {
    if (total === 0) return 0
    return Math.round((count / total) * 100)
}

function getReviewLikeLabel(likeCount: number) {
    if (likeCount <= 0) {
        return '도움이 돼요'
    }

    return `${likeCount}명에게 도움이 됐어요`
}

function getWriterLabel(target: WriterLabelTarget) {
    return target.writerNickName ?? '알 수 없음'
}

function isSecretInquiry(inquiry: ProductInquiryListItem) {
    return inquiry.secret === true
}

function getInquirySubmitErrorMessage(error: unknown, mode: 'create' | 'edit') {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const responseData = error.response?.data

        if (status === 401 || status === 403) {
            return mode === 'edit'
                ? '문의 수정은 작성자만 가능합니다.'
                : '문의 작성은 로그인 후 이용해주세요.'
        }

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

    return mode === 'edit'
        ? '문의 수정에 실패했습니다.'
        : '문의 등록에 실패했습니다.'
}

function getInquiryDetailErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const responseData = error.response?.data

        if (status === 401 || status === 403) {
            return '비밀글은 작성자만 조회할 수 있습니다.'
        }

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

    return '문의 내용을 불러오지 못했습니다.'
}

function getInquiryListErrorMessage(error: unknown) {

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

    return '상품문의를 불러오지 못했습니다.'
}

function getProductActionErrorMessage(error: unknown, fallback: string) {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const responseData = error.response?.data

        if (status === 401 || status === 403) {
            return '로그인 후 이용해주세요.'
        }

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

function isLoginError(error: unknown) {
    return axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)
}

function ReviewRatingRow({ label, percent }: { label: string; percent: number }) {
    return (
        <div className="product-review-rating-row">
            <span className="product-review-rating-label">{label}</span>

            <div className="product-review-bar-track">
                <div
                    className="product-review-bar-fill"
                    style={{
                        width: `${percent}%`,
                    }}
                />
            </div>

            <span className="product-review-rating-percent">{percent}%</span>
        </div>
    )
}

function PageState({ text }: { text: string }) {
    return <div className="product-detail-state-box">{text}</div>
}

function ProductDetailImage({
                                imageUrl,
                                alt,
                            }: {
    imageUrl: string | null
    alt: string
}) {
    const [imageError, setImageError] = useState(false)

    useEffect(() => {
        setImageError(false)
    }, [imageUrl])

    if (!imageUrl || imageError) {
        return <span className="product-detail-image-placeholder">이미지 없음</span>
    }

    return (
        <img
            className="product-detail-image-img"
            src={imageUrl}
            alt={alt}
            onError={() => setImageError(true)}
        />
    )
}

function ProductDescriptionImage({
                                     imageUrl,
                                     alt,
                                 }: {
    imageUrl: string | null
    alt: string
}) {
    const [imageError, setImageError] = useState(false)

    useEffect(() => {
        setImageError(false)
    }, [imageUrl])

    if (!imageUrl || imageError) {
        return (
            <div className="product-detail-description-image-empty">
                상세 설명 이미지가 없습니다.
            </div>
        )
    }

    return (
        <img
            className="product-detail-description-image"
            src={imageUrl}
            alt={alt}
            onError={() => setImageError(true)}
        />
    )
}

export default function ProductDetailPage() {
    const navigate = useNavigate()
    const location = useLocation()

    const { id } = useParams()
    const [searchParams, setSearchParams] = useSearchParams()

    const [detail, setDetail] = useState<ProductDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const tabParam = searchParams.get('tab')
    const activeTab: ProductDetailTab =
        tabParam === 'review' || tabParam === 'inquiry' ? tabParam : 'detail'

    const [reviewSort, setReviewSort] = useState<ReviewSortType>('BEST')
    const [reviewRatingFilter, setReviewRatingFilter] = useState<number | 'ALL'>('ALL')
    const [reviewPage, setReviewPage] = useState(0)

    const [reviewPageData, setReviewPageData] = useState<ReviewPageResponse | null>(null)
    const [reviewsLoading, setReviewsLoading] = useState(false)
    const [reviewsError, setReviewsError] = useState('')

    const [likedReviewMap, setLikedReviewMap] = useState<Record<number, boolean>>({})
    const [reviewLikeLoadingMap, setReviewLikeLoadingMap] = useState<Record<number, boolean>>({})

    const [inquiries, setInquiries] = useState<ProductInquiryListItem[]>([])
    const [inquiriesLoading, setInquiriesLoading] = useState(true)
    const [inquiriesError, setInquiriesError] = useState('')

    const [openInquiryId, setOpenInquiryId] = useState<number | null>(null)
    const [inquiryDetailMap, setInquiryDetailMap] = useState<Record<number, ProductInquiryDetailItem>>({})
    const [inquiryDetailLoadingId, setInquiryDetailLoadingId] = useState<number | null>(null)
    const [inquiryDetailErrorMap, setInquiryDetailErrorMap] = useState<Record<number, string>>({})

    const [currentMember, setCurrentMember] = useState<MemberInfo | null>(null)
    const [viewMode, setViewMode] = useState<'all' | 'mine'>('all')
    const [currentPage, setCurrentPage] = useState(1)


    const [showInquiryForm, setShowInquiryForm] = useState(false)
    const [inquiryForm, setInquiryForm] = useState({
        title: '',
        content: '',
        secret: false,
    })
    const [inquirySubmitLoading, setInquirySubmitLoading] = useState(false)
    const [inquirySubmitError, setInquirySubmitError] = useState('')

    const [editingInquiryId, setEditingInquiryId] = useState<number | null>(null)

    const [productActionLoading, setProductActionLoading] = useState<ProductActionType>(null)

    const [isWished, setIsWished] = useState(false)

    const [quantity, setQuantity] = useState(1)

    function moveToLoginPage() {
        navigate('/login', {
            state: {
                from: {
                    pathname: location.pathname,
                    search: location.search,
                    hash: location.hash,
                },
            },
        })
    }

    function handleTabChange(tab: ProductDetailTab) {
        const nextSearchParams = new URLSearchParams(searchParams)

        if (tab === 'detail') {
            nextSearchParams.delete('tab')
        } else {
            nextSearchParams.set('tab', tab)
        }

        setSearchParams(nextSearchParams)
    }

    async function loadProductDetail() {
        if (!id) {
            setError('잘못된 접근입니다.')
            setLoading(false)
            return
        }

        try {
            const response = await axios.get<ProductDetail>(`${API_BASE_URL}/products/${id}`)
            setDetail(response.data)
        } catch (e) {
            setError('상품 상세를 불러오지 못했습니다.')
        } finally {
            setLoading(false)
        }
    }

    async function loadReviews() {
        if (!id) {
            setReviewsError('상품 정보가 올바르지 않습니다.')
            return
        }

        try {
            setReviewsLoading(true)
            setReviewsError('')

            const params: Record<string, string | number> = {
                sort: reviewSort,
                page: reviewPage,
                size: 10,
            }

            if (reviewRatingFilter !== 'ALL') {
                params.rating = reviewRatingFilter
            }

            const response = await axios.get<ReviewPageResponse>(
                `${API_BASE_URL}/products/${id}/reviews`,
                {
                    params,
                    withCredentials: true,
                },
            )

            const nextLikedMap: Record<number, boolean> = {}

            response.data.reviews.forEach((review) => {
                nextLikedMap[review.reviewId] = review.likedByCurrentUser ?? false
            })

            setReviewPageData(response.data)
            setLikedReviewMap(nextLikedMap)
        } catch (e) {
            setReviewsError('상품후기를 불러오지 못했습니다.')
        } finally {
            setReviewsLoading(false)
        }
    }

    async function loadInquiries() {
        if (!id) {
            setInquiriesError('상품 정보가 올바르지 않습니다.')
            setInquiriesLoading(false)
            return
        }

        try {
            setInquiriesLoading(true)
            setInquiriesError('')

            const response = await axios.get<ProductInquiryListItem[]>(
                `${API_BASE_URL}/products/${id}/inquiries`,
            )

            setInquiries(response.data)
        } catch (e) {
            setInquiriesError(getInquiryListErrorMessage(e))
        } finally {
            setInquiriesLoading(false)
        }
    }

    async function loadMyInfo() {
        try {
            const response = await axios.get<MemberInfo | null>(`${API_BASE_URL}/member/myinfo`, {
                withCredentials: true,
            })

            if (!response.data) {
                setCurrentMember(null)
                return
            }

            setCurrentMember(response.data)
        } catch (e) {
            setCurrentMember(null)
        }
    }

    async function loadWishlistStatus(productId: number) {
        try {
            const response = await axios.get<WishlistListItem[]>(
                `${API_BASE_URL}/mypage/wishlist`,
                {
                    withCredentials: true,
                },
            )

            const wished = response.data.some((item) => item.productId === productId)
            setIsWished(wished)
        } catch (e) {
            setIsWished(false)
        }
    }

    useEffect(() => {
        void loadProductDetail()
    }, [id])

    useEffect(() => {
        void loadReviews()
    }, [id, reviewSort, reviewRatingFilter, reviewPage])

    useEffect(() => {
        setReviewPage(0)
    }, [reviewSort, reviewRatingFilter])

    useEffect(() => {
        void loadInquiries()
    }, [id])

    useEffect(() => {
        void loadMyInfo()
    }, [])

    useEffect(() => {
        if (!detail?.id || !currentMember) {
            setIsWished(false)
            return
        }

        void loadWishlistStatus(detail.id)
    }, [detail?.id, currentMember])

    useEffect(() => {
        setQuantity(1)
    }, [detail?.id])

    const reviewSummary = reviewPageData?.summary ?? null
    const reviewItems = reviewPageData?.reviews ?? []
    const reviewTotalPages = reviewPageData?.totalPages ?? 0
    const reviewHasNext = reviewPageData?.hasNext ?? false
    const reviewHasPrevious = reviewPageData?.hasPrevious ?? false

    const totalReviewCount = reviewSummary?.totalCount ?? 0
    const fiveStarPercent = reviewSummary ? getRatingPercent(reviewSummary.fiveStarCount, totalReviewCount) : 0
    const fourStarPercent = reviewSummary ? getRatingPercent(reviewSummary.fourStarCount, totalReviewCount) : 0
    const threeStarPercent = reviewSummary ? getRatingPercent(reviewSummary.threeStarCount, totalReviewCount) : 0
    const twoStarPercent = reviewSummary ? getRatingPercent(reviewSummary.twoStarCount, totalReviewCount) : 0
    const oneStarPercent = reviewSummary ? getRatingPercent(reviewSummary.oneStarCount, totalReviewCount) : 0

    function isMyInquiry(inquiry: ProductInquiryListItem) {
        if (!currentMember?.id) {
            return false
        }

        return inquiry.writerId === currentMember.id
    }

    const filteredInquiries = useMemo(() => {
        if (viewMode === 'mine') {
            return inquiries.filter(isMyInquiry)
        }

        return inquiries
    }, [inquiries, viewMode, currentMember])

    const totalPages = Math.max(1, Math.ceil(filteredInquiries.length / PAGE_SIZE))

    useEffect(() => {
        setCurrentPage(1)
    }, [viewMode])

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

    const pagedInquiries = filteredInquiries.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    )

    async function handleToggleReviewLike(reviewId: number) {
        if (!id) return

        try {
            setReviewLikeLoadingMap((prev) => ({
                ...prev,
                [reviewId]: true,
            }))

            const response = await axios.post<ReviewLikeToggleResponse>(
                `${API_BASE_URL}/products/${id}/reviews/${reviewId}/like`,
                {},
                { withCredentials: true },
            )

            const { liked, likeCount } = response.data

            setLikedReviewMap((prev) => ({
                ...prev,
                [reviewId]: liked,
            }))

            setReviewPageData((prev) => {
                if (!prev) return prev

                return {
                    ...prev,
                    reviews: prev.reviews.map((review) =>
                        review.reviewId === reviewId
                            ? {
                                ...review,
                                likeCount,
                            }
                            : review,
                    ),
                }
            })
        } catch (e) {
            if (axios.isAxiosError(e) && [401, 403].includes(e.response?.status ?? 0)) {
                alert('리뷰 추천은 로그인 후 이용해주세요.')
                moveToLoginPage()
                return
            }

            alert('리뷰 추천 처리에 실패했습니다.')
        } finally {
            setReviewLikeLoadingMap((prev) => ({
                ...prev,
                [reviewId]: false,
            }))
        }
    }

    async function handleToggleInquiry(inquiry: ProductInquiryListItem) {
        if (!id) return

        if (openInquiryId === inquiry.id) {
            setOpenInquiryId(null)
            return
        }

        if (inquiryDetailMap[inquiry.id]) {
            setOpenInquiryId(inquiry.id)
            return
        }

        try {
            setInquiryDetailLoadingId(inquiry.id)
            setInquiryDetailErrorMap((prev) => {
                const next = { ...prev }
                delete next[inquiry.id]
                return next
            })

            const response = await axios.get<ProductInquiryDetailItem>(
                `${API_BASE_URL}/products/${id}/inquiries/${inquiry.id}`,
                {
                    withCredentials: true,
                },
            )

            setInquiryDetailMap((prev) => ({
                ...prev,
                [inquiry.id]: response.data,
            }))
            setOpenInquiryId(inquiry.id)
        } catch (e) {
            setInquiryDetailErrorMap((prev) => ({
                ...prev,
                [inquiry.id]: getInquiryDetailErrorMessage(e),
            }))
            setOpenInquiryId(inquiry.id)
        } finally {
            setInquiryDetailLoadingId(null)
        }
    }

    async function handleSubmitInquiry() {
        if (!id) return

        if (!inquiryForm.title.trim()) {
            setInquirySubmitError('문의 제목을 입력해주세요.')
            return
        }

        if (!inquiryForm.content.trim()) {
            setInquirySubmitError('문의 내용을 입력해주세요.')
            return
        }

        try {
            setInquirySubmitLoading(true)
            setInquirySubmitError('')

            if (editingInquiryId) {
                const editingInquiry = inquiries.find((inquiry) => inquiry.id === editingInquiryId)

                if (editingInquiry?.status === 'ANSWERED') {
                    setInquirySubmitError('관리자 답변이 완료된 문의는 수정할 수 없습니다.')
                    return
                }

                await axios.patch(
                    `${API_BASE_URL}/products/${id}/inquiries/${editingInquiryId}`,
                    {
                        title: inquiryForm.title,
                        content: inquiryForm.content,
                        secret: inquiryForm.secret,
                    },
                    {
                        withCredentials: true,
                    },
                )

                setInquiries((prev) =>
                    prev.map((inquiry) =>
                        inquiry.id === editingInquiryId
                            ? {
                                ...inquiry,
                                title: inquiryForm.title,
                                secret: inquiryForm.secret,
                            }
                            : inquiry,
                    ),
                )

                setInquiryDetailMap((prev) => {
                    const currentDetail = prev[editingInquiryId]
                    if (!currentDetail) return prev

                    return {
                        ...prev,
                        [editingInquiryId]: {
                            ...currentDetail,
                            title: inquiryForm.title,
                            content: inquiryForm.content,
                        },
                    }
                })
            } else {
                await axios.post(
                    `${API_BASE_URL}/products/${id}/inquiries`,
                    {
                        title: inquiryForm.title,
                        content: inquiryForm.content,
                        secret: inquiryForm.secret,
                    },
                    {
                        withCredentials: true,
                    },
                )

                await loadInquiries()
            }

            setInquiryForm({
                title: '',
                content: '',
                secret: false,
            })
            setShowInquiryForm(false)
            setEditingInquiryId(null)
            setViewMode('all')
            setCurrentPage(1)
        } catch (e) {
            setInquirySubmitError(
                getInquirySubmitErrorMessage(e, editingInquiryId ? 'edit' : 'create'),
            )
        } finally {
            setInquirySubmitLoading(false)
        }
    }

    function handleStartEditInquiry(
        inquiry: ProductInquiryListItem,
        detailItem: ProductInquiryDetailItem,
    ) {
        setEditingInquiryId(inquiry.id)
        setShowInquiryForm(true)
        setInquirySubmitError('')

        setInquiryForm({
            title: inquiry.title,
            content: detailItem.content ?? '',
            secret: inquiry.secret ?? false,
        })
    }

    async function handleDeleteInquiry(inquiryId: number) {
        if (!id) return

        const confirmed = window.confirm('문의글을 삭제할까요?')
        if (!confirmed) return

        try {
            await axios.delete(`${API_BASE_URL}/products/${id}/inquiries/${inquiryId}`, {
                withCredentials: true,
            })

            if (openInquiryId === inquiryId) {
                setOpenInquiryId(null)
            }

            setInquiryDetailMap((prev) => {
                const next = { ...prev }
                delete next[inquiryId]
                return next
            })

            await loadInquiries()
        } catch (e) {
            alert('문의 삭제에 실패했습니다.')
        }
    }

    async function handleShareProduct() {
        const shareUrl = window.location.href

        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareUrl)
            } else {
                const textarea = document.createElement('textarea')
                textarea.value = shareUrl
                textarea.style.position = 'fixed'
                textarea.style.left = '-9999px'
                document.body.appendChild(textarea)
                textarea.focus()
                textarea.select()
                document.execCommand('copy')
                document.body.removeChild(textarea)
            }

            alert('상품 링크가 복사되었습니다.')
        } catch (error) {
            alert('링크 복사에 실패했습니다.')
        }
    }

    async function handleToggleWishlist() {
        if (!detail) return

        try {
            setProductActionLoading('wishlist')

            await axios.post(
                `${API_BASE_URL}/products/${detail.id}/wishlist`,
                {},
                {
                    withCredentials: true,
                },
            )

            const nextWished = !isWished
            setIsWished(nextWished)

            alert(nextWished ? '찜목록에 추가되었습니다.' : '찜하기가 취소되었습니다.')
        } catch (error) {
            if (isLoginError(error)) {
                alert('찜하기는 로그인 후 이용해주세요.')
                moveToLoginPage()
                return
            }

            alert(getProductActionErrorMessage(error, '찜하기 처리에 실패했습니다.'))
        } finally {
            setProductActionLoading(null)
        }
    }

    async function handleAddToCart() {
        if (!detail) return

        const productStock = Number(detail.stock ?? 0)
        const hasStockLimit = productStock > 0

        if (detail.status !== 'ON_SALE') {
            alert('현재 장바구니에 담을 수 없는 상품입니다.')
            return
        }

        if (quantity <= 0) {
            alert('수량은 1개 이상이어야 합니다.')
            return
        }

        if (hasStockLimit && quantity > productStock) {
            alert('선택 수량이 재고보다 많습니다.')
            return
        }

        try {
            setProductActionLoading('cart')

            await axios.post(
                `${API_BASE_URL}/products/${detail.id}/cart-items`,
                {
                    quantity,
                },
                {
                    withCredentials: true,
                },
            )

            alert('장바구니에 담았습니다.')
        } catch (error) {
            if (isLoginError(error)) {
                alert('장바구니는 로그인 후 이용해주세요.')
                moveToLoginPage()
                return
            }

            alert(getProductActionErrorMessage(error, '장바구니 담기에 실패했습니다.'))
        } finally {
            setProductActionLoading(null)
        }
    }

    function handleBuyProduct() {
        if (!detail) return

        const productStock = Number(detail.stock ?? 0)
        const hasStockLimit = productStock > 0

        if (detail.status !== 'ON_SALE') {
            alert('현재 구매할 수 없는 상품입니다.')
            return
        }

        if (quantity <= 0) {
            alert('수량은 1개 이상이어야 합니다.')
            return
        }

        if (hasStockLimit && quantity > productStock) {
            alert('선택하신 수량이 준비된 재고보다 많습니다.')
            return
        }

        navigate('/order-sheet', {
            state: {
                mode: 'PRODUCT_DIRECT',
                productId: detail.id,
                productName: detail.name,
                imageUrl: detail.imageUrl,
                quantity,
                price: detail.price,
            },
        })
    }

    if (loading) {
        return (
            <div className="product-detail-page">
                <SiteHeader />
                <div className="product-detail-container">
                    <PageState text="상품 상세를 불러오는 중입니다..." />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="product-detail-page">
                <SiteHeader />
                <div className="product-detail-container">
                    <PageState text={error} />
                </div>
            </div>
        )
    }

    if (!detail) {
        return (
            <div className="product-detail-page">
                <SiteHeader />
                <div className="product-detail-container">
                    <PageState text="상품 정보를 찾을 수 없습니다." />
                </div>
            </div>
        )
    }

    const productStock = Number(detail.stock ?? 0)
    const canBuyProduct = detail.status === 'ON_SALE'
    const hasStockLimit = productStock > 0

    return (
        <div className="product-detail-page">
            <SiteHeader />
            <div className="product-detail-container">
                <div className="product-detail-breadcrumb">
                    <Link to="/" className="product-detail-breadcrumb-link">
                        홈
                    </Link>
                    <span className="product-detail-breadcrumb-divider">/</span>
                    <span>상품 상세</span>
                </div>

                <section className="product-detail-hero">
                    <div className="product-detail-image-wrap">
                        <div className="product-detail-image-box">
                            <div className="product-detail-image-badge">대표 이미지</div>

                            <ProductDetailImage imageUrl={detail.imageUrl} alt={detail.name} />
                        </div>
                    </div>

                    <div className="product-detail-info">
                        <div className="product-detail-status-badge">
                            {getStatusLabel(detail.status)}
                        </div>

                        <h1 className="product-detail-title">{detail.name}</h1>

                        <p className="product-detail-description">{detail.description}</p>

                        <div className="product-detail-price-box">
                            {reviewSummary && reviewSummary.totalCount > 0 && (
                                <div className="product-detail-rating-row">
                                    <span className="product-detail-rating-stars">
                                        {renderStars(Math.round(reviewSummary.averageRating))}
                                    </span>
                                    <span className="product-detail-rating-score">
                                        {reviewSummary.averageRating.toFixed(1)}
                                    </span>
                                    <span className="product-detail-rating-count">
                                        총 {reviewSummary.totalCount.toLocaleString('ko-KR')}개
                                    </span>
                                </div>
                            )}

                            <div className="product-detail-sale-label">판매가</div>
                            <div className="product-detail-sale-price">
                                {formatPrice(detail.price)}
                            </div>
                        </div>

                        <div className="product-detail-option-box">
                            <div className="product-detail-option-title">구매 수량</div>

                            <div className="product-detail-quantity-row">
                                <button
                                    type="button"
                                    className="product-detail-quantity-button"
                                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                    disabled={!canBuyProduct || quantity <= 1}
                                >
                                    -
                                </button>

                                <input
                                    className="product-detail-quantity-input"
                                    type="number"
                                    min={1}
                                    max={hasStockLimit ? productStock : undefined}
                                    value={quantity}
                                    onChange={(e) => {
                                        const nextQuantity = Number(e.target.value)

                                        if (Number.isNaN(nextQuantity) || nextQuantity < 1) {
                                            setQuantity(1)
                                            return
                                        }

                                        if (hasStockLimit) {
                                            setQuantity(Math.min(productStock, nextQuantity))
                                            return
                                        }

                                        setQuantity(nextQuantity)
                                    }}
                                    disabled={!canBuyProduct}
                                />

                                <button
                                    type="button"
                                    className="product-detail-quantity-button"
                                    onClick={() =>
                                        setQuantity((prev) => {
                                            if (hasStockLimit) {
                                                return Math.min(productStock, prev + 1)
                                            }

                                            return prev + 1
                                        })
                                    }
                                    disabled={!canBuyProduct || (hasStockLimit && quantity >= productStock)}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="product-detail-button-row">
                            <button
                                type="button"
                                className="product-detail-ghost-button"
                                onClick={handleShareProduct}
                            >
                                공유
                            </button>

                            <button
                                type="button"
                                className={
                                    isWished
                                        ? 'product-detail-ghost-button product-detail-wishlist-button--active'
                                        : 'product-detail-ghost-button'
                                }
                                onClick={handleToggleWishlist}
                                disabled={productActionLoading === 'wishlist'}
                            >
                                {productActionLoading === 'wishlist'
                                    ? '처리 중...'
                                    : isWished
                                        ? '찜한 상품'
                                        : '찜하기'}
                            </button>

                            <button
                                type="button"
                                className="product-detail-ghost-button"
                                onClick={handleAddToCart}
                                disabled={productActionLoading === 'cart' || !canBuyProduct}
                            >
                                {productActionLoading === 'cart' ? '담는 중...' : '장바구니'}
                            </button>

                            <button
                                type="button"
                                className="product-detail-primary-button"
                                onClick={handleBuyProduct}
                                disabled={!canBuyProduct}
                            >
                                {canBuyProduct ? '구매하기' : '구매불가'}
                            </button>
                        </div>
                    </div>
                </section>

                <div className="product-detail-tab-wrap">
                    <div className="product-detail-tab-header">
                        <button
                            className={
                                activeTab === 'detail'
                                    ? 'product-detail-tab-button product-detail-tab-button--active'
                                    : 'product-detail-tab-button'
                            }
                            onClick={() => handleTabChange('detail')}
                        >
                            상세정보
                        </button>

                        <button
                            className={
                                activeTab === 'review'
                                    ? 'product-detail-tab-button product-detail-tab-button--active'
                                    : 'product-detail-tab-button'
                            }
                            onClick={() => handleTabChange('review')}
                        >
                            상품후기
                        </button>

                        <button
                            className={
                                activeTab === 'inquiry'
                                    ? 'product-detail-tab-button product-detail-tab-button--active'
                                    : 'product-detail-tab-button'
                            }
                            onClick={() => handleTabChange('inquiry')}
                        >
                            상품문의
                        </button>
                    </div>

                    {activeTab === 'detail' && (
                        <div className="product-detail-content-wrap">
                            <div className="product-detail-description-image-wrap">
                                <ProductDescriptionImage
                                    imageUrl={detail.detailImageUrl}
                                    alt={`${detail.name} 상세 설명 이미지`}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'review' && (
                        <div className="product-detail-content-wrap">
                            <div className="product-detail-text-box">
                                <h2 className="product-detail-section-title">상품 리뷰</h2>

                                {reviewsLoading ? (
                                    <div className="product-detail-state-box">
                                        상품후기를 불러오는 중입니다...
                                    </div>
                                ) : reviewsError ? (
                                    <div className="product-detail-state-box">{reviewsError}</div>
                                ) : !reviewSummary ? (
                                    <div className="product-detail-state-box">
                                        리뷰 정보를 불러오지 못했습니다.
                                    </div>
                                ) : (
                                    <div className="product-review-section-wrap">
                                        <div className="product-review-summary-box">
                                            <div className="product-review-average-row">
                                                <div className="product-review-average-stars">
                                                    {renderStars(
                                                        Math.round(reviewSummary.averageRating),
                                                    )}
                                                </div>
                                                <div className="product-review-average-score">
                                                    {reviewSummary.averageRating.toFixed(1)}
                                                </div>
                                            </div>

                                            <div className="product-review-total-count">
                                                총{' '}
                                                {reviewSummary.totalCount.toLocaleString('ko-KR')}
                                                개
                                            </div>

                                            <div className="product-review-rating-rows">
                                                <ReviewRatingRow label="최고" percent={fiveStarPercent} />
                                                <ReviewRatingRow label="좋음" percent={fourStarPercent} />
                                                <ReviewRatingRow label="보통" percent={threeStarPercent} />
                                                <ReviewRatingRow label="별로" percent={twoStarPercent} />
                                                <ReviewRatingRow label="나쁨" percent={oneStarPercent} />
                                            </div>
                                        </div>

                                        <div className="product-review-list-area">
                                            <div className="product-review-top-control-row">
                                                <div className="product-review-sort-button-group">
                                                    <button
                                                        className={
                                                            reviewSort === 'BEST'
                                                                ? 'product-review-sort-button product-review-sort-button--active'
                                                                : 'product-review-sort-button'
                                                        }
                                                        onClick={() => setReviewSort('BEST')}
                                                    >
                                                        베스트순
                                                    </button>

                                                    <button
                                                        className={
                                                            reviewSort === 'LATEST'
                                                                ? 'product-review-sort-button product-review-sort-button--active'
                                                                : 'product-review-sort-button'
                                                        }
                                                        onClick={() => setReviewSort('LATEST')}
                                                    >
                                                        최신순
                                                    </button>
                                                </div>

                                                <select
                                                    value={
                                                        reviewRatingFilter === 'ALL'
                                                            ? 'ALL'
                                                            : String(reviewRatingFilter)
                                                    }
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        setReviewRatingFilter(
                                                            value === 'ALL'
                                                                ? 'ALL'
                                                                : Number(value),
                                                        )
                                                    }}
                                                    className="product-review-filter-select"
                                                >
                                                    <option value="ALL">모든 별점</option>
                                                    <option value="5">최고</option>
                                                    <option value="4">좋음</option>
                                                    <option value="3">보통</option>
                                                    <option value="2">별로</option>
                                                    <option value="1">나쁨</option>
                                                </select>
                                            </div>

                                            {reviewItems.length === 0 ? (
                                                <div className="product-detail-state-box">
                                                    등록된 상품후기가 없습니다.
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="product-review-card-list">
                                                        {reviewItems.map((review) => (
                                                            <div
                                                                key={review.reviewId}
                                                                className="product-review-card"
                                                            >
                                                                <div className="product-review-top-meta-block">
                                                                    <div className="product-review-writer">
                                                                        {getWriterLabel(review)}
                                                                    </div>

                                                                    <div className="product-review-meta-inline-row">
                                                                        <span className="product-review-stars">
                                                                            {renderStars(review.rating)}
                                                                        </span>
                                                                        <span className="product-review-date">
                                                                            {formatReviewDate(review.createdAt)}
                                                                        </span>

                                                                        {(review.productNameSnapshot || review.quantity) && (
                                                                            <span className="product-review-purchase-info">
                                                                                {review.productNameSnapshot ?? ''}
                                                                                {review.quantity
                                                                                    ? `, ${review.quantity}개`
                                                                                    : ''}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="product-review-title">
                                                                    {review.title}
                                                                </div>

                                                                <div className="product-review-content">
                                                                    {review.content}
                                                                </div>

                                                                <div className="product-review-help-row">
                                                                    <button
                                                                        className={
                                                                            likedReviewMap[review.reviewId]
                                                                                ? 'product-review-help-button product-review-help-button--active'
                                                                                : 'product-review-help-button'
                                                                        }
                                                                        onClick={() =>
                                                                            handleToggleReviewLike(review.reviewId)
                                                                        }
                                                                        disabled={
                                                                            !!reviewLikeLoadingMap[review.reviewId]
                                                                        }
                                                                    >
                                                                        {reviewLikeLoadingMap[review.reviewId]
                                                                            ? '처리 중...'
                                                                            : getReviewLikeLabel(review.likeCount ?? 0)}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {reviewTotalPages > 1 && (
                                                        <div className="product-detail-pagination-wrap">
                                                            <button
                                                                className="product-detail-pagination-arrow-button"
                                                                onClick={() =>
                                                                    setReviewPage((prev) =>
                                                                        Math.max(0, prev - 1),
                                                                    )
                                                                }
                                                                disabled={!reviewHasPrevious}
                                                            >
                                                                {'<'}
                                                            </button>

                                                            {Array.from(
                                                                { length: reviewTotalPages },
                                                                (_, index) => index,
                                                            ).map((pageNumber) => (
                                                                <button
                                                                    key={pageNumber}
                                                                    className={
                                                                        pageNumber === reviewPage
                                                                            ? 'product-detail-page-button product-detail-page-button--active'
                                                                            : 'product-detail-page-button'
                                                                    }
                                                                    onClick={() => setReviewPage(pageNumber)}
                                                                >
                                                                    {pageNumber + 1}
                                                                </button>
                                                            ))}

                                                            <button
                                                                className="product-detail-pagination-arrow-button"
                                                                onClick={() =>
                                                                    setReviewPage((prev) =>
                                                                        Math.min(
                                                                            reviewTotalPages - 1,
                                                                            prev + 1,
                                                                        ),
                                                                    )
                                                                }
                                                                disabled={!reviewHasNext}
                                                            >
                                                                {'>'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'inquiry' && (
                        <div className="product-detail-content-wrap">
                            <div className="product-detail-text-box">
                                <h2 className="product-detail-section-title">상품문의</h2>

                                <div className="product-inquiry-guide-box">
                                    <ul className="product-inquiry-guide-list">
                                        <li>구매한 상품의 취소/반품은 구매내역에서 신청 가능합니다.</li>
                                        <li>
                                            상품문의 및 후기게시판을 통해 취소나 환불, 반품 등은
                                            처리되지 않습니다.
                                        </li>
                                        <li>
                                            가격, 판매자, 교환/환불 및 배송 등 해당 상품 자체와 관련
                                            없는 문의는 고객센터를 이용해주세요.
                                        </li>
                                        <li>개인정보는 공개 게시판에 남기지 않도록 주의해주세요.</li>
                                    </ul>
                                </div>

                                <div className="product-inquiry-top-control-row">
                                    <button
                                        className="product-inquiry-write-button"
                                        onClick={() => {
                                            if (!currentMember) {
                                                moveToLoginPage()
                                                return
                                            }

                                            setShowInquiryForm(true)
                                        }}
                                    >
                                        문의하기
                                    </button>

                                    <div className="product-inquiry-filter-button-group">
                                        <button
                                            className={
                                                viewMode === 'mine'
                                                    ? 'product-inquiry-small-button product-inquiry-small-button--active'
                                                    : 'product-inquiry-small-button'
                                            }
                                            onClick={() => {
                                                if (!currentMember) {
                                                    moveToLoginPage()
                                                    return
                                                }

                                                setViewMode('mine')
                                                setCurrentPage(1)
                                            }}
                                        >
                                            내 문의보기
                                        </button>

                                        <button
                                            className={
                                                viewMode === 'all'
                                                    ? 'product-inquiry-small-button product-inquiry-small-button--active'
                                                    : 'product-inquiry-small-button'
                                            }
                                            onClick={() => {
                                                setViewMode('all')
                                                setCurrentPage(1)
                                            }}
                                        >
                                            전체 문의보기
                                        </button>
                                    </div>
                                </div>

                                {!currentMember && (
                                    <div className="product-inquiry-sub-notice">
                                        내 문의보기와 문의 작성은 로그인 상태에서 사용할 수 있습니다.
                                    </div>
                                )}

                                {showInquiryForm && (
                                    <div className="product-inquiry-form-wrap">
                                        <div className="product-inquiry-form-title">
                                            {editingInquiryId ? '상품문의 수정' : '상품문의 작성'}
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="문의 제목을 입력해주세요."
                                            value={inquiryForm.title}
                                            onChange={(e) =>
                                                setInquiryForm((prev) => ({
                                                    ...prev,
                                                    title: e.target.value,
                                                }))
                                            }
                                            className="product-inquiry-input"
                                        />

                                        <textarea
                                            placeholder="문의 내용을 입력해주세요."
                                            value={inquiryForm.content}
                                            onChange={(e) =>
                                                setInquiryForm((prev) => ({
                                                    ...prev,
                                                    content: e.target.value,
                                                }))
                                            }
                                            className="product-inquiry-textarea"
                                        />

                                        <label className="product-inquiry-secret-label">
                                            <input
                                                type="checkbox"
                                                checked={inquiryForm.secret}
                                                onChange={(e) =>
                                                    setInquiryForm((prev) => ({
                                                        ...prev,
                                                        secret: e.target.checked,
                                                    }))
                                                }
                                            />
                                            <span>비밀글로 작성하기</span>
                                        </label>

                                        {inquirySubmitError && (
                                            <div className="product-inquiry-submit-error">
                                                {inquirySubmitError}
                                            </div>
                                        )}

                                        <div className="product-inquiry-form-button-row">
                                            <button
                                                className="product-inquiry-form-cancel-button"
                                                onClick={() => {
                                                    setShowInquiryForm(false)
                                                    setInquirySubmitError('')
                                                    setEditingInquiryId(null)
                                                }}
                                                disabled={inquirySubmitLoading}
                                            >
                                                취소
                                            </button>

                                            <button
                                                className="product-inquiry-form-submit-button"
                                                onClick={handleSubmitInquiry}
                                                disabled={inquirySubmitLoading}
                                            >
                                                {inquirySubmitLoading
                                                    ? editingInquiryId
                                                        ? '수정 중...'
                                                        : '등록 중...'
                                                    : editingInquiryId
                                                        ? '수정'
                                                        : '등록'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {inquiriesLoading ? (
                                    <div className="product-detail-state-box">
                                        상품문의를 불러오는 중입니다...
                                    </div>
                                ) : inquiriesError ? (
                                    <div className="product-detail-state-box">
                                        {inquiriesError}
                                    </div>
                                ) : filteredInquiries.length === 0 ? (
                                    <div className="product-detail-state-box">
                                        {viewMode === 'mine'
                                            ? '내가 작성한 상품문의가 없습니다.'
                                            : '등록된 상품문의가 없습니다.'}
                                    </div>
                                ) : (
                                    <>
                                        <div className="product-inquiry-list">
                                            {pagedInquiries.map((inquiry) => {
                                                const isOpen = openInquiryId === inquiry.id
                                                const detailItem = inquiryDetailMap[inquiry.id]
                                                const detailError = inquiryDetailErrorMap[inquiry.id]
                                                const isDetailLoading =
                                                    inquiryDetailLoadingId === inquiry.id
                                                const isSecret = isSecretInquiry(inquiry)

                                                return (
                                                    <div
                                                        key={inquiry.id}
                                                        className="product-inquiry-card"
                                                    >
                                                        <div className="product-inquiry-card-header">
                                                            <div className="product-inquiry-card-header-left">
                                                                <div className="product-inquiry-top-row">
                                                                    <span
                                                                        className={
                                                                            inquiry.status === 'ANSWERED'
                                                                                ? 'product-inquiry-status-badge product-inquiry-status-badge--answered'
                                                                                : 'product-inquiry-status-badge product-inquiry-status-badge--waiting'
                                                                        }
                                                                    >
                                                                        {getInquiryStatusLabel(
                                                                            inquiry.status,
                                                                        )}
                                                                    </span>

                                                                    <strong className="product-inquiry-title">
                                                                        {isSecret
                                                                            ? '🔒 비밀문의입니다.'
                                                                            : inquiry.title}
                                                                    </strong>
                                                                </div>

                                                                <div className="product-inquiry-meta">
                                                                    <span>
                                                                        {getWriterLabel(inquiry)}
                                                                    </span>
                                                                    <span>·</span>
                                                                    <span>
                                                                        {formatInquiryDate(
                                                                            inquiry.createdAt,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {!isSecret && (
                                                                <button
                                                                    className="product-inquiry-arrow-button"
                                                                    onClick={() =>
                                                                        handleToggleInquiry(inquiry)
                                                                    }
                                                                >
                                                                    {isOpen ? '▲' : '▼'}
                                                                </button>
                                                            )}
                                                        </div>

                                                        {isOpen && (
                                                            <div className="product-inquiry-detail-box">
                                                                {isDetailLoading ? (
                                                                    <div className="product-inquiry-detail-text">
                                                                        문의 내용을 불러오는 중입니다...
                                                                    </div>
                                                                ) : detailError ? (
                                                                    <div className="product-inquiry-detail-error">
                                                                        {detailError}
                                                                    </div>
                                                                ) : detailItem ? (
                                                                    <>
                                                                        <div className="product-inquiry-detail-section">
                                                                            <div className="product-inquiry-detail-label">
                                                                                문의 내용
                                                                            </div>
                                                                            <div className="product-inquiry-detail-text">
                                                                                {detailItem.content}
                                                                            </div>
                                                                        </div>

                                                                        {detailItem.answerContent && (
                                                                            <div className="product-inquiry-answer-section">
                                                                                <div className="product-inquiry-detail-label">
                                                                                    답변 내용
                                                                                </div>
                                                                                <div className="product-inquiry-detail-text">
                                                                                    {
                                                                                        detailItem.answerContent
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {isMyInquiry(inquiry) && (
                                                                            <div className="product-inquiry-action-row">
                                                                                <button
                                                                                    type="button"
                                                                                    className="product-inquiry-text-action-button"
                                                                                    onClick={() => {
                                                                                        if (!detailItem) return
                                                                                        handleStartEditInquiry(
                                                                                            inquiry,
                                                                                            detailItem,
                                                                                        )
                                                                                    }}
                                                                                >
                                                                                    수정
                                                                                </button>

                                                                                <button
                                                                                    type="button"
                                                                                    className="product-inquiry-text-action-button"
                                                                                    onClick={() =>
                                                                                        handleDeleteInquiry(
                                                                                            inquiry.id,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    삭제
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <div className="product-inquiry-detail-text">
                                                                        문의 내용을 불러오지 못했습니다.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {totalPages > 1 && (
                                            <div className="product-detail-pagination-wrap">
                                                <button
                                                    className="product-detail-pagination-arrow-button"
                                                    onClick={() =>
                                                        setCurrentPage((prev) =>
                                                            Math.max(1, prev - 1),
                                                        )
                                                    }
                                                    disabled={currentPage === 1}
                                                >
                                                    {'<'}
                                                </button>

                                                {Array.from(
                                                    { length: totalPages },
                                                    (_, index) => index + 1,
                                                ).map((page) => (
                                                    <button
                                                        key={page}
                                                        className={
                                                            page === currentPage
                                                                ? 'product-detail-page-button product-detail-page-button--active'
                                                                : 'product-detail-page-button'
                                                        }
                                                        onClick={() => setCurrentPage(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}

                                                <button
                                                    className="product-detail-pagination-arrow-button"
                                                    onClick={() =>
                                                        setCurrentPage((prev) =>
                                                            Math.min(totalPages, prev + 1),
                                                        )
                                                    }
                                                    disabled={currentPage === totalPages}
                                                >
                                                    {'>'}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}