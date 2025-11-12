import React, { useEffect, useState } from 'react';
import './Home.css';

function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="home">
      <h1>DUAN1 - Nhóm 5</h1>
      <p>Chào mừng đến với ứng dụng của chúng tôi</p>
      
      {loading && <p>Loading...</p>}
      {data && (
        <div className="status">
          <p>Backend Status: {data.status}</p>
        </div>
      )}
    </div>
  );
}

export default Home;
