export interface ProductInquiryListItem {
    id: number
    title: string
    writerNickName: string
    status: 'WAITING' | 'ANSWERED'
    createdAt: string
}