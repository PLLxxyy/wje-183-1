import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Result from './pages/Result'
import History from './pages/History'

export default function App() {
  return (
    <BrowserRouter>
      <header className="app-header">
        <div className="header-inner">
          <a href="/" className="header-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="18" rx="2"/>
              <line x1="8" y1="7" x2="16" y2="7"/>
              <line x1="8" y1="11" x2="16" y2="11"/>
              <line x1="8" y1="15" x2="12" y2="15"/>
            </svg>
            个税计算器
          </a>
          <nav className="header-nav">
            <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>
              计算
            </NavLink>
            <NavLink to="/history" className={({isActive}) => isActive ? 'active' : ''}>
              历史记录
            </NavLink>
          </nav>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/result" element={<Result />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  )
}
