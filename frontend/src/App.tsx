import { Route, Routes } from 'react-router-dom'
import NoticeListPage from './pages/notices/NoticeListPage.tsx'
import NoticeDetailPage from './pages/notices/NoticeDetailPage.tsx'
import HotDealDetailPage from './pages/hotdeals/HotDealDetailPage.tsx'
import ProductDetailPage from './pages/products/ProductDetailPage.tsx'
import LoginPage from './pages/auth/LoginPage.tsx'
import SiteHeader from './components/SiteHeader'
import SignupPage from './pages/auth/SignupPage.tsx'
import CartPage from './pages/cart/CartPage.tsx'
import OrderSheetPage from './pages/orders/OrderSheetPage.tsx'
import OrderDetailPage from './pages/orders/OrderDetailPage.tsx'
import OrderListPage from './pages/orders/OrderListPage.tsx'
import WishlistPage from './pages/mypage/WishlistPage.tsx'
import MyInquiryPage from './pages/mypage/MyInquiryPage.tsx'
import MyReviewPage from './pages/mypage/MyReviewPage.tsx'
import MyPage from './pages/mypage/MyPage.tsx'
import MyPagePasswordCheck from './pages/mypage/MyPagePasswordCheck.tsx'
import MyPageEditMyInfo from './pages/mypage/MyPageEditMyInfo.tsx'
import ReviewCreatePage from './pages/mypage/reviews/ReviewCreatePage.tsx'
import NoticeCreatePage from './pages/admin/notices/NoticeCreatePage.tsx'
import NoticeEditPage from './pages/admin/notices/NoticeEditPage.tsx'
import AdminHomePage from './pages/admin/home/AdminHomePage.tsx'
import AdminOrderPage from './pages/admin/orders/AdminOrderPage.tsx'
import AdminInquiryPage from './pages/admin/inquiries/AdminInquiryPage.tsx'
import AdminProductCreatePage from './pages/admin/products/AdminProductCreatePage.tsx'
import AdminProductManagePage from './pages/admin/products/AdminProductManagePage.tsx'
import AdminProductEditPage from './pages/admin/products/AdminProductEditPage.tsx'
import HomePage from './pages/home/HomePage.tsx'
import AdminHotDealCreatePage from './pages/admin/hotdeals/AdminHotDealCreatePage.tsx'
import AdminHotDealManagePage from './pages/admin/hotdeals/AdminHotDealManagePage.tsx'
import AdminHotDealEditPage from './pages/admin/hotdeals/AdminHotDealEditPage.tsx'

function PlaceholderPage({ title }: { title: string }) {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
            <SiteHeader />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900 }}>{title}</h1>
                <p style={{ marginTop: '12px', color: '#6b7280' }}>추후 구현 예정입니다.</p>
            </div>
        </div>
    )
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route path="/notices" element={<NoticeListPage />} />
            <Route path="/notices/:id" element={<NoticeDetailPage />} />
            <Route path="/admin/notices/new" element={<NoticeCreatePage />} />
            <Route path="/admin/notices/:id/edit" element={<NoticeEditPage />} />

            <Route path="/admin" element={<AdminHomePage />} />
            <Route path="/admin/orders" element={<AdminOrderPage />} />
            <Route path="/admin/inquiries" element={<AdminInquiryPage />} />
            <Route path="/admin/products" element={<AdminProductManagePage />} />
            <Route path="/admin/products/new" element={<AdminProductCreatePage />} />
            <Route path="/admin/products/:id/edit" element={<AdminProductEditPage />} />
            <Route path="/admin/hotdeals" element={<AdminHotDealManagePage />} />
            <Route path="/admin/hotdeals/new" element={<AdminHotDealCreatePage />} />
            <Route path="/admin/hotdeals/:hotDealId/edit" element={<AdminHotDealEditPage />} />

            <Route path="/hotdeals/:id" element={<HotDealDetailPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />

            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/cart-items" element={<CartPage />} />
            <Route path="/orders" element={<PlaceholderPage title="주문 목록" />} />
            <Route path="/order-sheet" element={<OrderSheetPage />} />

            <Route path="/mypage" element={<MyPage />} />
            <Route path="/mypage/orders" element={<OrderListPage />} />
            <Route path="/mypage/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/mypage/inquiries" element={<MyInquiryPage />} />
            <Route path="/mypage/reviews" element={<MyReviewPage />} />
            <Route path="/mypage/reviews/write" element={<ReviewCreatePage />} />
            <Route path="/mypage/password-check" element={<MyPagePasswordCheck />} />
            <Route path="/mypage/edit-myinfo" element={<MyPageEditMyInfo />} />
        </Routes>
    )
}