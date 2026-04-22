import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {BrowserRouter} from "react-router-dom";

// 프론트 앱의 진입점 -> "리액트 앱 시작해!"
/*
main.tsx에서 하는 일
    1.React 앱 실행
    2. App 컴포넌트 렌더링
    3. 라우터 연결
    4. 연력 css import
 */

createRoot(document.getElementById('root')!).render(
    //createRoot(...) -> 서버의 서블릿 컨테이너 구동
    //.render(...) -> 메인 서블릿 실행. 구동된 엔진 위에 실제 App을 올리는 과정

    //<StricMode> -> 개발 모드 디버거
    //<BrowserRouter> -> 라우팅 컨텍스트(의존성 주입)
  <StrictMode>
      <BrowserRouter>
          <App />
      </BrowserRouter>
  </StrictMode>,
)
