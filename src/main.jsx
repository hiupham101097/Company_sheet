import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initSecurityGuard } from './utils/securityGuard';

// Khởi chạy hệ thống bảo vệ Anti-Inspection & DevTools Trap
initSecurityGuard();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
