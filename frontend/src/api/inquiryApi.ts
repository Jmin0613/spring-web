import axios from 'axios'

import type { ProductInquiryListItem } from '../types/inquiry'

const API_BASE_URL = '/api'

export async function fetchProductInquiries(productId: string ): Promise<ProductInquiryListItem[]> {

    const response = await axios.get(`${API_BASE_URL}/products/${productId}/inquiries`)

    return response.data
}