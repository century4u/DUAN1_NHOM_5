import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tourService } from '../../services/api';
import './TourDetail.css';

const TourDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchTour();
  }, [id]);

  const fetchTour = async () => {
    try {
      const response = await tourService.getById(id);
      if (response.data.success) {
        setTour(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải thông tin tour');
    } finally {
      setLoading(false);
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <button onClick={() => navigate('/admin/tours')} className="btn btn-primary">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  if (!tour) {
    return <div className="error">Không tìm thấy tour</div>;
  }

  const tabs = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'itinerary', label: 'Lịch trình' },
    { id: 'pricing', label: 'Giá cả' },
    { id: 'images', label: 'Hình ảnh' },
    { id: 'policies', label: 'Chính sách' },
    { id: 'suppliers', label: 'Nhà cung cấp' },
  ];

  return (
    <div className="tour-detail">
      <div className="tour-detail-header">
        <button onClick={() => navigate('/admin/tours')} className="btn-back">
          ← Quay lại
        </button>
        <h1>{tour.name}</h1>
        <div className="tour-meta">
          <span className={`category-badge category-${tour.category}`}>
            {getCategoryLabel(tour.category)}
          </span>
          <span className={`status-badge status-${tour.status}`}>
            {getStatusLabel(tour.status)}
          </span>
        </div>
      </div>

      <div className="tour-detail-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tour-detail-content">
        {/* Tab: Tổng quan */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="detail-section">
              <h2>Thông tin cơ bản</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label>Tên tour:</label>
                  <div>{tour.name}</div>
                </div>
                <div className="info-item">
                  <label>Loại tour:</label>
                  <div>{getCategoryLabel(tour.category)}</div>
                </div>
                <div className="info-item">
                  <label>Điểm đến:</label>
                  <div>{tour.destination}</div>
                </div>
                <div className="info-item">
                  <label>Thời gian:</label>
                  <div>{tour.duration} ngày</div>
                </div>
                <div className="info-item">
                  <label>Giá cơ bản:</label>
                  <div className="price">{formatPrice(tour.price)}</div>
                </div>
                <div className="info-item">
                  <label>Số lượng tối đa:</label>
                  <div>{tour.maxParticipants} người</div>
                </div>
                <div className="info-item full-width">
                  <label>Mô tả:</label>
                  <div>{tour.description}</div>
                </div>
                {tour.customRequirements && (
                  <div className="info-item full-width">
                    <label>Yêu cầu riêng:</label>
                    <div>{tour.customRequirements}</div>
                  </div>
                )}
              </div>
            </div>

            {tour.included && tour.included.length > 0 && (
              <div className="detail-section">
                <h2>Dịch vụ bao gồm</h2>
                <ul className="service-list">
                  {tour.included.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {tour.excluded && tour.excluded.length > 0 && (
              <div className="detail-section">
                <h2>Dịch vụ không bao gồm</h2>
                <ul className="service-list">
                  {tour.excluded.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tab: Lịch trình */}
        {activeTab === 'itinerary' && (
          <div className="tab-content">
            {tour.itinerary && tour.itinerary.length > 0 ? (
              tour.itinerary.map((day, index) => (
                <div key={index} className="itinerary-day">
                  <div className="day-header">
                    <h3>Ngày {day.day || index + 1}</h3>
                    {day.time && <span className="day-time">{day.time}</span>}
                  </div>
                  {day.title && <h4>{day.title}</h4>}
                  {day.location && (
                    <div className="day-location">
                      <strong>Địa điểm:</strong> {day.location}
                    </div>
                  )}
                  {day.description && (
                    <div className="day-description">{day.description}</div>
                  )}
                  {day.attractions && day.attractions.length > 0 && (
                    <div className="attractions">
                      <strong>Điểm tham quan:</strong>
                      <ul>
                        {day.attractions.map((attraction, idx) => (
                          <li key={idx}>
                            <strong>{attraction.name}</strong>
                            {attraction.visitDuration && (
                              <span> ({attraction.visitDuration})</span>
                            )}
                            {attraction.description && (
                              <div>{attraction.description}</div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {day.activities && day.activities.length > 0 && (
                    <div className="activities">
                      <strong>Hoạt động:</strong>
                      <ul>
                        {day.activities.map((activity, idx) => (
                          <li key={idx}>
                            {activity.time && <span className="activity-time">{activity.time}</span>}
                            <strong>{activity.activity}</strong>
                            {activity.description && (
                              <div>{activity.description}</div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state">Chưa có lịch trình</div>
            )}
          </div>
        )}

        {/* Tab: Giá cả */}
        {activeTab === 'pricing' && (
          <div className="tab-content">
            {tour.pricing && (
              <div className="detail-section">
                <h2>Giá theo đối tượng</h2>
                <div className="pricing-grid">
                  {tour.pricing.adult > 0 && (
                    <div className="pricing-item">
                      <label>Người lớn:</label>
                      <div className="price">{formatPrice(tour.pricing.adult)}</div>
                    </div>
                  )}
                  {tour.pricing.child > 0 && (
                    <div className="pricing-item">
                      <label>Trẻ em:</label>
                      <div className="price">{formatPrice(tour.pricing.child)}</div>
                    </div>
                  )}
                  {tour.pricing.infant > 0 && (
                    <div className="pricing-item">
                      <label>Em bé:</label>
                      <div className="price">{formatPrice(tour.pricing.infant)}</div>
                    </div>
                  )}
                  {tour.pricing.senior > 0 && (
                    <div className="pricing-item">
                      <label>Người cao tuổi:</label>
                      <div className="price">{formatPrice(tour.pricing.senior)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tour.servicePackages && tour.servicePackages.length > 0 && (
              <div className="detail-section">
                <h2>Gói dịch vụ</h2>
                {tour.servicePackages.map((pkg, index) => (
                  <div key={index} className="package-item">
                    <h4>{pkg.name}</h4>
                    {pkg.price > 0 && (
                      <div className="price">{formatPrice(pkg.price)}</div>
                    )}
                    {pkg.description && <div>{pkg.description}</div>}
                    {pkg.features && pkg.features.length > 0 && (
                      <ul>
                        {pkg.features.map((feature, idx) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Hình ảnh */}
        {activeTab === 'images' && (
          <div className="tab-content">
            {tour.images && tour.images.length > 0 ? (
              <div className="image-gallery">
                {tour.images.map((image, index) => (
                  <div key={index} className="image-item">
                    <img src={image} alt={`Tour ${index + 1}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">Chưa có hình ảnh</div>
            )}
          </div>
        )}

        {/* Tab: Chính sách */}
        {activeTab === 'policies' && (
          <div className="tab-content">
            {tour.policies && (
              <>
                {tour.policies.booking && (
                  <div className="detail-section">
                    <h2>Chính sách đặt tour</h2>
                    {tour.policies.booking.advanceBookingDays > 0 && (
                      <div className="policy-item">
                        <strong>Đặt trước tối thiểu:</strong> {tour.policies.booking.advanceBookingDays} ngày
                      </div>
                    )}
                    {tour.policies.booking.description && (
                      <div>{tour.policies.booking.description}</div>
                    )}
                  </div>
                )}

                {tour.policies.cancellation && (
                  <div className="detail-section">
                    <h2>Chính sách hủy tour</h2>
                    {tour.policies.cancellation.freeCancellationDays > 0 && (
                      <div className="policy-item">
                        <strong>Hủy miễn phí:</strong> Trước {tour.policies.cancellation.freeCancellationDays} ngày
                      </div>
                    )}
                    {tour.policies.cancellation.cancellationFee > 0 && (
                      <div className="policy-item">
                        <strong>Phí hủy:</strong> {tour.policies.cancellation.cancellationFee}%
                      </div>
                    )}
                    {tour.policies.cancellation.description && (
                      <div>{tour.policies.cancellation.description}</div>
                    )}
                  </div>
                )}

                {tour.policies.rescheduling && (
                  <div className="detail-section">
                    <h2>Chính sách đổi lịch</h2>
                    <div className="policy-item">
                      <strong>Cho phép đổi lịch:</strong> {tour.policies.rescheduling.allowed ? 'Có' : 'Không'}
                    </div>
                    {tour.policies.rescheduling.allowed && (
                      <>
                        {tour.policies.rescheduling.fee > 0 && (
                          <div className="policy-item">
                            <strong>Phí đổi lịch:</strong> {formatPrice(tour.policies.rescheduling.fee)}
                          </div>
                        )}
                        {tour.policies.rescheduling.advanceNoticeDays > 0 && (
                          <div className="policy-item">
                            <strong>Báo trước:</strong> {tour.policies.rescheduling.advanceNoticeDays} ngày
                          </div>
                        )}
                        {tour.policies.rescheduling.description && (
                          <div>{tour.policies.rescheduling.description}</div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {tour.policies.refund && (
                  <div className="detail-section">
                    <h2>Chính sách hoàn tiền</h2>
                    <div className="policy-item">
                      <strong>Có thể hoàn tiền:</strong> {tour.policies.refund.refundable ? 'Có' : 'Không'}
                    </div>
                    {tour.policies.refund.refundable && (
                      <>
                        {tour.policies.refund.refundPercentage > 0 && (
                          <div className="policy-item">
                            <strong>% Hoàn tiền:</strong> {tour.policies.refund.refundPercentage}%
                          </div>
                        )}
                        {tour.policies.refund.refundTimeframe && (
                          <div className="policy-item">
                            <strong>Thời gian hoàn tiền:</strong> {tour.policies.refund.refundTimeframe}
                          </div>
                        )}
                        {tour.policies.refund.description && (
                          <div>{tour.policies.refund.description}</div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {tour.policies.terms && (
                  <div className="detail-section">
                    <h2>Điều khoản chung</h2>
                    <div>{tour.policies.terms}</div>
                  </div>
                )}

                {tour.policies.specialTerms && (
                  <div className="detail-section">
                    <h2>Điều khoản riêng</h2>
                    <div>{tour.policies.specialTerms}</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab: Nhà cung cấp */}
        {activeTab === 'suppliers' && (
          <div className="tab-content">
            {tour.suppliers && (
              <>
                {tour.suppliers.hotels && tour.suppliers.hotels.length > 0 && (
                  <div className="detail-section">
                    <h2>Khách sạn</h2>
                    {tour.suppliers.hotels.map((hotel, index) => (
                      <div key={index} className="supplier-item">
                        <h4>{hotel.name}</h4>
                        {hotel.location && <div><strong>Địa điểm:</strong> {hotel.location}</div>}
                        {hotel.rating && <div><strong>Xếp hạng:</strong> {hotel.rating} sao</div>}
                        {hotel.description && <div>{hotel.description}</div>}
                        {hotel.contact && (
                          <div className="contact-info">
                            {hotel.contact.phone && <div><strong>Điện thoại:</strong> {hotel.contact.phone}</div>}
                            {hotel.contact.email && <div><strong>Email:</strong> {hotel.contact.email}</div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {tour.suppliers.transportation && tour.suppliers.transportation.length > 0 && (
                  <div className="detail-section">
                    <h2>Phương tiện vận chuyển</h2>
                    {tour.suppliers.transportation.map((transport, index) => (
                      <div key={index} className="supplier-item">
                        <h4>{transport.provider}</h4>
                        {transport.type && <div><strong>Loại:</strong> {transport.type}</div>}
                        {transport.vehicleType && <div><strong>Loại xe:</strong> {transport.vehicleType}</div>}
                        {transport.description && <div>{transport.description}</div>}
                        {transport.contact && (
                          <div className="contact-info">
                            {transport.contact.phone && <div><strong>Điện thoại:</strong> {transport.contact.phone}</div>}
                            {transport.contact.email && <div><strong>Email:</strong> {transport.contact.email}</div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {tour.suppliers.restaurants && tour.suppliers.restaurants.length > 0 && (
                  <div className="detail-section">
                    <h2>Nhà hàng</h2>
                    {tour.suppliers.restaurants.map((restaurant, index) => (
                      <div key={index} className="supplier-item">
                        <h4>{restaurant.name}</h4>
                        {restaurant.location && <div><strong>Địa điểm:</strong> {restaurant.location}</div>}
                        {restaurant.cuisine && <div><strong>Loại ẩm thực:</strong> {restaurant.cuisine}</div>}
                        {restaurant.description && <div>{restaurant.description}</div>}
                        {restaurant.contact && (
                          <div className="contact-info">
                            {restaurant.contact.phone && <div><strong>Điện thoại:</strong> {restaurant.contact.phone}</div>}
                            {restaurant.contact.email && <div><strong>Email:</strong> {restaurant.contact.email}</div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {tour.suppliers.guides && tour.suppliers.guides.length > 0 && (
                  <div className="detail-section">
                    <h2>Hướng dẫn viên</h2>
                    {tour.suppliers.guides.map((guide, index) => (
                      <div key={index} className="supplier-item">
                        <h4>{guide.name}</h4>
                        {guide.language && guide.language.length > 0 && (
                          <div><strong>Ngôn ngữ:</strong> {guide.language.join(', ')}</div>
                        )}
                        {guide.rating && <div><strong>Xếp hạng:</strong> {guide.rating}/5</div>}
                        {guide.description && <div>{guide.description}</div>}
                        {guide.contact && (
                          <div className="contact-info">
                            {guide.contact.phone && <div><strong>Điện thoại:</strong> {guide.contact.phone}</div>}
                            {guide.contact.email && <div><strong>Email:</strong> {guide.contact.email}</div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(!tour.suppliers.hotels || tour.suppliers.hotels.length === 0) &&
                  (!tour.suppliers.transportation || tour.suppliers.transportation.length === 0) &&
                  (!tour.suppliers.restaurants || tour.suppliers.restaurants.length === 0) &&
                  (!tour.suppliers.guides || tour.suppliers.guides.length === 0) && (
                    <div className="empty-state">Chưa có thông tin nhà cung cấp</div>
                  )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TourDetail;

