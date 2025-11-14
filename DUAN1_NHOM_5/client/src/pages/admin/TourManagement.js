import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tourService, tourVersionService } from '../../services/api';
import TourForm from '../../components/tour/TourForm';
import TourVersionForm from '../../components/tour/TourVersionForm';
import QuickQuoteForm from '../../components/quote/QuickQuoteForm';
import './TourManagement.css';

const TourManagement = () => {
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [selectedTourForVersion, setSelectedTourForVersion] = useState(null);
  const [versions, setVersions] = useState({});
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: '',
  });

  useEffect(() => {
    fetchTours();
  }, [filters]);

  const fetchTours = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const response = await tourService.getAll(params);
      if (response.data.success) {
        setTours(response.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách tour');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tour này?')) {
      return;
    }

    try {
      await tourService.delete(id);
      fetchTours();
      alert('Xóa tour thành công');
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa tour');
    }
  };

  const handleEdit = (tour) => {
    setEditingTour(tour);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTour(null);
    fetchTours();
  };

  const handleVersionFormClose = () => {
    setShowVersionForm(false);
    setSelectedTourForVersion(null);
    fetchTours();
  };

  const handleCreateVersion = (tour) => {
    setSelectedTourForVersion(tour);
    setShowVersionForm(true);
  };

  const fetchVersionsForTour = async (tourId) => {
    try {
      const response = await tourVersionService.getByTour(tourId);
      if (response.data.success) {
        setVersions((prev) => ({
          ...prev,
          [tourId]: response.data.data || [],
        }));
      }
    } catch (err) {
      console.error('Error fetching versions:', err);
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      domestic: 'Tour trong nước',
      international: 'Tour quốc tế',
      custom: 'Tour theo yêu cầu',
    };
    return labels[category] || category;
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Hoạt động',
      inactive: 'Ngừng hoạt động',
      draft: 'Nháp',
    };
    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    const classes = {
      active: 'status-active',
      inactive: 'status-inactive',
      draft: 'status-draft',
    };
    return classes[status] || '';
  };

  return (
    <div className="tour-management">
      <div className="tour-management-header">
        <h1>Quản lý Tour và Sản phẩm Du lịch</h1>
        <div className="header-actions">
          <button className="btn btn-success" onClick={() => setShowQuoteForm(true)}>
             Tạo Báo Giá Nhanh
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Thêm Tour Mới
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Loại tour:</label>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">Tất cả</option>
            <option value="domestic">Tour trong nước</option>
            <option value="international">Tour quốc tế</option>
            <option value="custom">Tour theo yêu cầu</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Trạng thái:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
            <option value="draft">Nháp</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Tìm kiếm:</label>
          <input
            type="text"
            placeholder="Tên tour, điểm đến..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      {/* Tour List */}
      {loading && <div className="loading">Đang tải...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <div className="tour-list">
          {tours.length === 0 ? (
            <div className="empty-state">Chưa có tour nào</div>
          ) : (
            <table className="tour-table">
              <thead>
                <tr>
                  <th>Tên Tour</th>
                  <th>Loại Tour</th>
                  <th>Điểm Đến</th>
                  <th>Giá (VNĐ)</th>
                  <th>Thời Gian</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {tours.map((tour) => (
                  <tr key={tour._id}>
                    <td>
                      <div className="tour-name">{tour.name}</div>
                      <div className="tour-description">{tour.description.substring(0, 100)}...</div>
                    </td>
                    <td>
                      <span className={`category-badge category-${tour.category}`}>
                        {getCategoryLabel(tour.category)}
                      </span>
                    </td>
                    <td>{tour.destination}</td>
                    <td>{new Intl.NumberFormat('vi-VN').format(tour.price)}</td>
                    <td>{tour.duration} ngày</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(tour.status)}`}>
                        {getStatusLabel(tour.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-view"
                          onClick={() => navigate(`/admin/tours/${tour._id}`)}
                          title="Xem chi tiết"
                        >
                          Xem
                        </button>
                        <button
                          className="btn btn-sm btn-version"
                          onClick={() => {
                            if (!versions[tour._id]) {
                              fetchVersionsForTour(tour._id);
                            }
                            handleCreateVersion(tour);
                          }}
                          title="Tạo version"
                        >
                          Version
                        </button>
                        <button
                          className="btn btn-sm btn-edit"
                          onClick={() => handleEdit(tour)}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn btn-sm btn-delete"
                          onClick={() => handleDelete(tour._id)}
                        >
                          Xóa
                        </button>
                      </div>
                      {versions[tour._id] && versions[tour._id].length > 0 && (
                        <div className="versions-count">
                          <span className="versions-badge">
                            {versions[tour._id].length} version(s)
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tour Form Modal */}
      {showForm && (
        <TourForm
          tour={editingTour}
          onClose={handleFormClose}
          onSave={handleFormClose}
        />
      )}

      {/* Tour Version Form Modal */}
      {showVersionForm && (
        <TourVersionForm
          tour={selectedTourForVersion}
          onClose={handleVersionFormClose}
          onSave={handleVersionFormClose}
        />
      )}

      {/* Quick Quote Form Modal */}
      {showQuoteForm && (
        <QuickQuoteForm
          onClose={() => setShowQuoteForm(false)}
          onSave={(quote) => {
            setShowQuoteForm(false);
            alert(`Tạo báo giá thành công! Số báo giá: ${quote.quoteNumber}`);
            // Có thể navigate đến trang xem báo giá
          }}
        />
      )}
    </div>
  );
};

export default TourManagement;

