export interface ProductInquiryListItem {
    //문의 한 줄 데이터가 어떻게 생겼는지

    id: number //문의 번호
    title: string // 문의 제목
    writerNickName: string //문의자 닉네임
    status: 'WAITING' | 'ANSWERED' // 답변대기/답변완료
    createdAt: string // 작성일
    // 백엔드 목록 응답 모양 그대로 맞춤.
}