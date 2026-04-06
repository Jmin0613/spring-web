import {Navigate, Route, Routes} from "react-router-dom";
import NoticeListPage from "./pages/NoticeListPage.tsx";
import NoticeDetailPage from "./pages/NoticeDetailPage.tsx";
import './App.css'

function App() {
  // 경로 2개 연결
  return (
      <Routes>
        <Route path="/" element={<Navigate to="/notices" replace />} />
        <Route path="/notices" element={<NoticeListPage />} />
        <Route path="/notices/:id" element={<NoticeDetailPage />} />
      </Routes>
  )
}

export default App
