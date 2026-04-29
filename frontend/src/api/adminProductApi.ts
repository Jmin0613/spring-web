import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080'

export type ProductCategoryCode =
    | 'FOOD'
    | 'LIFE'
    | 'ELECTRONICS'
    | 'BEAUTY'
    | 'FASHION'
    | 'BOOK'

export type ProductStatus = 'ON_SALE' | 'SOLD_OUT' | 'HIDDEN'

export type AdminProductCreateRequest = {
    name: string
    description: string
    imageUrl: string
    detailImageUrl: string
    price: number
    stock: number
    category: ProductCategoryCode
}

export type AdminProductUpdateRequest = {
    name: string
    description: string
    imageUrl: string
    detailImageUrl: string
    price: number
    stock: number
    category: ProductCategoryCode
}

export type AdminProductListItem = {
    id?: number
    productId?: number

    name: string
    description?: string
    imageUrl?: string

    price: number
    stock: number
    category: string
    status: ProductStatus

    wishCount?: number
    purchaseCount?: number

    createdAt?: string
    updatedAt?: string
}

export type AdminProductDetail = {
    id?: number
    productId?: number

    name: string
    description: string
    imageUrl: string
    detailImageUrl: string

    price: number
    stock: number
    category: string
    status: ProductStatus

    wishCount?: number
    purchaseCount?: number

    createdAt?: string
    updatedAt?: string
}

export type AdminImageUploadResponse = {
    imageUrl: string
}

export async function uploadAdminImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post<AdminImageUploadResponse>(
        `${API_BASE_URL}/admin/images`,
        formData,
        {
            withCredentials: true,
        },
    )

    return response.data.imageUrl
}

export async function createAdminProduct(
    request: AdminProductCreateRequest,
): Promise<number> {
    const response = await axios.post<number>(
        `${API_BASE_URL}/admin/products`,
        request,
        {
            withCredentials: true,
        },
    )

    return response.data
}

export async function fetchAdminProducts(): Promise<AdminProductListItem[]> {
    const response = await axios.get<AdminProductListItem[]>(
        `${API_BASE_URL}/admin/products`,
        {
            withCredentials: true,
        },
    )

    return response.data
}

export async function fetchAdminProductDetail(
    productId: string | number,
): Promise<AdminProductDetail> {
    const response = await axios.get<AdminProductDetail>(
        `${API_BASE_URL}/admin/products/${productId}`,
        {
            withCredentials: true,
        },
    )

    return response.data
}

export async function updateAdminProduct(
    productId: string | number,
    request: AdminProductUpdateRequest,
): Promise<void> {
    await axios.patch(
        `${API_BASE_URL}/admin/products/${productId}`,
        request,
        {
            withCredentials: true,
        },
    )
}

export async function updateAdminProductStatus(
    productId: string | number,
    status: ProductStatus,
): Promise<void> {
    await axios.patch(
        `${API_BASE_URL}/admin/products/${productId}/status`,
        {
            status,
        },
        {
            withCredentials: true,
        },
    )
}

// delete Api 남겨두지만 사용x.
export async function deleteAdminProduct(productId: string | number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/admin/products/${productId}`, {
        withCredentials: true,
    })
}