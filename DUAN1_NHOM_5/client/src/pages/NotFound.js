import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Trang không tìm thấy</h2>
        <p>Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Về trang chủ
        </button>
      </div>
    </div>
  );
};

export default NotFound;

