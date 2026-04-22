// 공지 목록
export interface NoticeListItem{
    id : number // 공지 번호
    title : string // 공지 제목
    createdAt : string //공지 작성일
}

// 공지 상세보기
export interface NoticeDetail {
    id : number // 공지 번호
    title : string // 공지 제목
    content : string // 공지 내용
    createdAt : string // 공지 작성일
    updatedAt : string // 수정일
}