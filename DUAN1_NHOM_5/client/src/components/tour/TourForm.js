import React, { useState, useEffect } from 'react';
import { tourService } from '../../services/api';
import './TourForm.css';

const TourForm = ({ tour, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'domestic',
    price: '',
    duration: '',
    destination: '',
    maxParticipants: 50,
    status: 'draft',
    images: [],
    itinerary: [],
    included: [],
    excluded: [],
    customRequirements: '',
    pricing: {
      adult: '',
      child: '',
      infant: '',
      senior: '',
    },
    seasonalPricing: [],
    servicePackages: [],
    policies: {
      booking: {
        advanceBookingDays: '',
        description: '',
      },
      cancellation: {
        freeCancellationDays: '',
        cancellationFee: '',
        description: '',
        terms: [],
      },
      rescheduling: {
        allowed: false,
        fee: '',
        advanceNoticeDays: '',
        description: '',
      },
      refund: {
        refundable: false,
        refundPercentage: '',
        refundTimeframe: '',
        description: '',
      },
      terms: '',
      specialTerms: '',
    },
    suppliers: {
      hotels: [],
      transportation: [],
      restaurants: [],
      guides: [],
      otherSuppliers: [],
    },
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tour) {
      setFormData({
        name: tour.name || '',
        description: tour.description || '',
        category: tour.category || 'domestic',
        price: tour.price || '',
        duration: tour.duration || '',
        destination: tour.destination || '',
        maxParticipants: tour.maxParticipants || 50,
        status: tour.status || 'draft',
        images: tour.images || [],
        itinerary: tour.itinerary || [],
        included: tour.included || [],
        excluded: tour.excluded || [],
        customRequirements: tour.customRequirements || '',
        pricing: tour.pricing || {
          adult: '',
          child: '',
          infant: '',
          senior: '',
        },
        seasonalPricing: tour.seasonalPricing || [],
        servicePackages: tour.servicePackages || [],
        policies: tour.policies || {
          booking: { advanceBookingDays: '', description: '' },
          cancellation: { freeCancellationDays: '', cancellationFee: '', description: '', terms: [] },
          rescheduling: { allowed: false, fee: '', advanceNoticeDays: '', description: '' },
          refund: { refundable: false, refundPercentage: '', refundTimeframe: '', description: '' },
          terms: '',
          specialTerms: '',
        },
        suppliers: tour.suppliers || {
          hotels: [],
          transportation: [],
          restaurants: [],
          guides: [],
          otherSuppliers: [],
        },
      });
    }
  }, [tour]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (child.includes('.')) {
        const [subChild, subSubChild] = child.split('.');
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [subChild]: {
              ...prev[parent][subChild],
              [subSubChild]: type === 'checkbox' ? checked : value,
            },
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : value,
          },
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleArrayChange = (field, index, value) => {
    setFormData((prev) => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const handleAddArrayItem = (field, defaultValue = '') => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], defaultValue],
    }));
  };

  const handleRemoveArrayItem = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleItineraryChange = (index, field, value) => {
    setFormData((prev) => {
      const newItinerary = [...prev.itinerary];
      newItinerary[index] = { ...newItinerary[index], [field]: value };
      return { ...prev, itinerary: newItinerary };
    });
  };

  const handleImageChange = (index, value) => {
    setFormData((prev) => {
      const newImages = [...prev.images];
      newImages[index] = value;
      return { ...prev, images: newImages };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        duration: parseInt(formData.duration) || 1,
        maxParticipants: parseInt(formData.maxParticipants) || 50,
        pricing: {
          adult: parseFloat(formData.pricing.adult) || 0,
          child: parseFloat(formData.pricing.child) || 0,
          infant: parseFloat(formData.pricing.infant) || 0,
          senior: parseFloat(formData.pricing.senior) || 0,
        },
        policies: {
          ...formData.policies,
          booking: {
            ...formData.policies.booking,
            advanceBookingDays: parseInt(formData.policies.booking.advanceBookingDays) || 0,
          },
          cancellation: {
            ...formData.policies.cancellation,
            freeCancellationDays: parseInt(formData.policies.cancellation.freeCancellationDays) || 0,
            cancellationFee: parseFloat(formData.policies.cancellation.cancellationFee) || 0,
          },
          rescheduling: {
            ...formData.policies.rescheduling,
            fee: parseFloat(formData.policies.rescheduling.fee) || 0,
            advanceNoticeDays: parseInt(formData.policies.rescheduling.advanceNoticeDays) || 0,
          },
          refund: {
            ...formData.policies.refund,
            refundPercentage: parseFloat(formData.policies.refund.refundPercentage) || 0,
          },
        },
      };

      if (tour) {
        await tourService.update(tour._id, data);
      } else {
        await tourService.create(data);
      }

      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu tour');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Thông tin cơ bản' },
    { id: 'itinerary', label: 'Lịch trình' },
    { id: 'pricing', label: 'Giá cả' },
    { id: 'images', label: 'Hình ảnh' },
    { id: 'policies', label: 'Chính sách' },
    { id: 'suppliers', label: 'Nhà cung cấp' },
  ];

  return (
    <div className="tour-form-overlay" onClick={onClose}>
      <div className="tour-form-modal large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tour-form-header">
          <h2>{tour ? 'Sửa Tour' : 'Thêm Tour Mới'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="tour-form-tabs">
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

        <form onSubmit={handleSubmit} className="tour-form">
          {error && <div className="error-message">{error}</div>}

          {/* Tab: Thông tin cơ bản */}
          {activeTab === 'basic' && (
            <div className="tab-content">
              <div className="form-group">
                <label>Tên Tour *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mô tả *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Loại Tour *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="domestic">Tour trong nước</option>
                    <option value="international">Tour quốc tế</option>
                    <option value="custom">Tour theo yêu cầu</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Trạng Thái *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="draft">Nháp</option>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Ngừng hoạt động</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Điểm Đến *</label>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Thời Gian (ngày) *</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Giá (VNĐ) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Số Lượng Tối Đa</label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
              </div>

              {formData.category === 'custom' && (
                <div className="form-group">
                  <label>Yêu Cầu Riêng</label>
                  <textarea
                    name="customRequirements"
                    value={formData.customRequirements}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Mô tả yêu cầu cụ thể của tour..."
                  />
                </div>
              )}

              <div className="form-group">
                <label>Dịch Vụ Bao Gồm</label>
                {formData.included.map((item, index) => (
                  <div key={index} className="array-item">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange('included', index, e.target.value)}
                      placeholder="Dịch vụ bao gồm"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveArrayItem('included', index)}
                    >
                      Xóa
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddArrayItem('included')}
                  className="btn-add-item"
                >
                  + Thêm dịch vụ
                </button>
              </div>

              <div className="form-group">
                <label>Dịch Vụ Không Bao Gồm</label>
                {formData.excluded.map((item, index) => (
                  <div key={index} className="array-item">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange('excluded', index, e.target.value)}
                      placeholder="Dịch vụ không bao gồm"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveArrayItem('excluded', index)}
                    >
                      Xóa
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddArrayItem('excluded')}
                  className="btn-add-item"
                >
                  + Thêm dịch vụ
                </button>
              </div>
            </div>
          )}

          {/* Tab: Lịch trình */}
          {activeTab === 'itinerary' && (
            <div className="tab-content">
              <div className="form-group">
                <label>Lịch Trình Tour</label>
                {formData.itinerary.map((day, index) => (
                  <div key={index} className="itinerary-day">
                    <div className="day-header">
                      <h4>Ngày {day.day || index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveArrayItem('itinerary', index)}
                      >
                        Xóa ngày
                      </button>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Số ngày</label>
                        <input
                          type="number"
                          value={day.day || index + 1}
                          onChange={(e) => handleItineraryChange(index, 'day', parseInt(e.target.value))}
                          min="1"
                        />
                      </div>
                      <div className="form-group">
                        <label>Giờ</label>
                        <input
                          type="text"
                          placeholder="08:00"
                          value={day.time || ''}
                          onChange={(e) => handleItineraryChange(index, 'time', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Tiêu đề</label>
                      <input
                        type="text"
                        value={day.title || ''}
                        onChange={(e) => handleItineraryChange(index, 'title', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Mô tả</label>
                      <textarea
                        value={day.description || ''}
                        onChange={(e) => handleItineraryChange(index, 'description', e.target.value)}
                        rows="3"
                      />
                    </div>
                    <div className="form-group">
                      <label>Địa điểm</label>
                      <input
                        type="text"
                        value={day.location || ''}
                        onChange={(e) => handleItineraryChange(index, 'location', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddArrayItem('itinerary', {
                    day: formData.itinerary.length + 1,
                    title: '',
                    description: '',
                    location: '',
                    time: '',
                    attractions: [],
                    activities: [],
                  })}
                  className="btn-add-item"
                >
                  + Thêm ngày
                </button>
              </div>
            </div>
          )}

          {/* Tab: Giá cả */}
          {activeTab === 'pricing' && (
            <div className="tab-content">
              <div className="section-title">Giá theo đối tượng</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Giá Người Lớn (VNĐ)</label>
                  <input
                    type="number"
                    name="pricing.adult"
                    value={formData.pricing.adult}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Giá Trẻ Em (VNĐ)</label>
                  <input
                    type="number"
                    name="pricing.child"
                    value={formData.pricing.child}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Giá Em Bé (VNĐ)</label>
                  <input
                    type="number"
                    name="pricing.infant"
                    value={formData.pricing.infant}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Giá Người Cao Tuổi (VNĐ)</label>
                  <input
                    type="number"
                    name="pricing.senior"
                    value={formData.pricing.senior}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="section-title">Gói dịch vụ</div>
              {formData.servicePackages.map((pkg, index) => (
                <div key={index} className="package-item">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tên gói</label>
                      <input
                        type="text"
                        value={pkg.name || ''}
                        onChange={(e) => {
                          const newPkgs = [...formData.servicePackages];
                          newPkgs[index] = { ...newPkgs[index], name: e.target.value };
                          setFormData({ ...formData, servicePackages: newPkgs });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Giá (VNĐ)</label>
                      <input
                        type="number"
                        value={pkg.price || ''}
                        onChange={(e) => {
                          const newPkgs = [...formData.servicePackages];
                          newPkgs[index] = { ...newPkgs[index], price: e.target.value };
                          setFormData({ ...formData, servicePackages: newPkgs });
                        }}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <button
                        type="button"
                        onClick={() => handleRemoveArrayItem('servicePackages', index)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Mô tả</label>
                    <textarea
                      value={pkg.description || ''}
                      onChange={(e) => {
                        const newPkgs = [...formData.servicePackages];
                        newPkgs[index] = { ...newPkgs[index], description: e.target.value };
                        setFormData({ ...formData, servicePackages: newPkgs });
                      }}
                      rows="2"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddArrayItem('servicePackages', { name: '', description: '', price: 0, features: [] })}
                className="btn-add-item"
              >
                + Thêm gói dịch vụ
              </button>
            </div>
          )}

          {/* Tab: Hình ảnh */}
          {activeTab === 'images' && (
            <div className="tab-content">
              <div className="form-group">
                <label>Hình ảnh Tour (URL)</label>
                {formData.images.map((image, index) => (
                  <div key={index} className="array-item">
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveArrayItem('images', index)}
                    >
                      Xóa
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddArrayItem('images', '')}
                  className="btn-add-item"
                >
                  + Thêm hình ảnh
                </button>
              </div>
            </div>
          )}

          {/* Tab: Chính sách */}
          {activeTab === 'policies' && (
            <div className="tab-content">
              <div className="section-title">Chính sách đặt tour</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Số ngày đặt trước tối thiểu</label>
                  <input
                    type="number"
                    name="policies.booking.advanceBookingDays"
                    value={formData.policies.booking.advanceBookingDays}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Mô tả chính sách đặt tour</label>
                <textarea
                  name="policies.booking.description"
                  value={formData.policies.booking.description}
                  onChange={handleChange}
                  rows="2"
                />
              </div>

              <div className="section-title">Chính sách hủy tour</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Số ngày hủy miễn phí</label>
                  <input
                    type="number"
                    name="policies.cancellation.freeCancellationDays"
                    value={formData.policies.cancellation.freeCancellationDays}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Phí hủy (%)</label>
                  <input
                    type="number"
                    name="policies.cancellation.cancellationFee"
                    value={formData.policies.cancellation.cancellationFee}
                    onChange={handleChange}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Mô tả chính sách hủy</label>
                <textarea
                  name="policies.cancellation.description"
                  value={formData.policies.cancellation.description}
                  onChange={handleChange}
                  rows="2"
                />
              </div>

              <div className="section-title">Chính sách đổi lịch</div>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="policies.rescheduling.allowed"
                      checked={formData.policies.rescheduling.allowed}
                      onChange={handleChange}
                    />
                    Cho phép đổi lịch
                  </label>
                </div>
                <div className="form-group">
                  <label>Phí đổi lịch (VNĐ)</label>
                  <input
                    type="number"
                    name="policies.rescheduling.fee"
                    value={formData.policies.rescheduling.fee}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Số ngày báo trước</label>
                  <input
                    type="number"
                    name="policies.rescheduling.advanceNoticeDays"
                    value={formData.policies.rescheduling.advanceNoticeDays}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Mô tả chính sách đổi lịch</label>
                <textarea
                  name="policies.rescheduling.description"
                  value={formData.policies.rescheduling.description}
                  onChange={handleChange}
                  rows="2"
                />
              </div>

              <div className="section-title">Chính sách hoàn tiền</div>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="policies.refund.refundable"
                      checked={formData.policies.refund.refundable}
                      onChange={handleChange}
                    />
                    Có thể hoàn tiền
                  </label>
                </div>
                <div className="form-group">
                  <label>% Hoàn tiền</label>
                  <input
                    type="number"
                    name="policies.refund.refundPercentage"
                    value={formData.policies.refund.refundPercentage}
                    onChange={handleChange}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label>Thời gian hoàn tiền</label>
                  <input
                    type="text"
                    name="policies.refund.refundTimeframe"
                    value={formData.policies.refund.refundTimeframe}
                    onChange={handleChange}
                    placeholder="7-14 ngày làm việc"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Mô tả chính sách hoàn tiền</label>
                <textarea
                  name="policies.refund.description"
                  value={formData.policies.refund.description}
                  onChange={handleChange}
                  rows="2"
                />
              </div>

              <div className="section-title">Điều khoản</div>
              <div className="form-group">
                <label>Điều khoản chung</label>
                <textarea
                  name="policies.terms"
                  value={formData.policies.terms}
                  onChange={handleChange}
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label>Điều khoản riêng</label>
                <textarea
                  name="policies.specialTerms"
                  value={formData.policies.specialTerms}
                  onChange={handleChange}
                  rows="4"
                />
              </div>
            </div>
          )}

          {/* Tab: Nhà cung cấp */}
          {activeTab === 'suppliers' && (
            <div className="tab-content">
              <div className="section-title">Khách sạn</div>
              {formData.suppliers.hotels.map((hotel, index) => (
                <div key={index} className="supplier-item">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tên khách sạn</label>
                      <input
                        type="text"
                        value={hotel.name || ''}
                        onChange={(e) => {
                          const newHotels = [...formData.suppliers.hotels];
                          newHotels[index] = { ...newHotels[index], name: e.target.value };
                          setFormData({
                            ...formData,
                            suppliers: { ...formData.suppliers, hotels: newHotels },
                          });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Địa điểm</label>
                      <input
                        type="text"
                        value={hotel.location || ''}
                        onChange={(e) => {
                          const newHotels = [...formData.suppliers.hotels];
                          newHotels[index] = { ...newHotels[index], location: e.target.value };
                          setFormData({
                            ...formData,
                            suppliers: { ...formData.suppliers, hotels: newHotels },
                          });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <button
                        type="button"
                        onClick={() => {
                          const newHotels = formData.suppliers.hotels.filter((_, i) => i !== index);
                          setFormData({
                            ...formData,
                            suppliers: { ...formData.suppliers, hotels: newHotels },
                          });
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    suppliers: {
                      ...formData.suppliers,
                      hotels: [...formData.suppliers.hotels, { name: '', location: '', rating: 0 }],
                    },
                  });
                }}
                className="btn-add-item"
              >
                + Thêm khách sạn
              </button>

              <div className="section-title">Phương tiện vận chuyển</div>
              {formData.suppliers.transportation.map((transport, index) => (
                <div key={index} className="supplier-item">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Loại phương tiện</label>
                      <input
                        type="text"
                        value={transport.type || ''}
                        onChange={(e) => {
                          const newTransport = [...formData.suppliers.transportation];
                          newTransport[index] = { ...newTransport[index], type: e.target.value };
                          setFormData({
                            ...formData,
                            suppliers: { ...formData.suppliers, transportation: newTransport },
                          });
                        }}
                        placeholder="xe, máy bay, tàu..."
                      />
                    </div>
                    <div className="form-group">
                      <label>Nhà cung cấp</label>
                      <input
                        type="text"
                        value={transport.provider || ''}
                        onChange={(e) => {
                          const newTransport = [...formData.suppliers.transportation];
                          newTransport[index] = { ...newTransport[index], provider: e.target.value };
                          setFormData({
                            ...formData,
                            suppliers: { ...formData.suppliers, transportation: newTransport },
                          });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <button
                        type="button"
                        onClick={() => {
                          const newTransport = formData.suppliers.transportation.filter((_, i) => i !== index);
                          setFormData({
                            ...formData,
                            suppliers: { ...formData.suppliers, transportation: newTransport },
                          });
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    suppliers: {
                      ...formData.suppliers,
                      transportation: [...formData.suppliers.transportation, { type: '', provider: '', vehicleType: '' }],
                    },
                  });
                }}
                className="btn-add-item"
              >
                + Thêm phương tiện
              </button>

              <div className="section-title">Nhà hàng</div>
              {formData.suppliers.restaurants.map((restaurant, index) => (
                <div key={index} className="supplier-item">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tên nhà hàng</label>
                      <input
                        type="text"
                        value={restaurant.name || ''}
                        onChange={(e) => {
                          const newRestaurants = [...formData.suppliers.restaurants];
                          newRestaurants[index] = { ...newRestaurants[index], name: e.target.value };
                          setFormData({
                            ...formData,
                            suppliers: { ...formData.suppliers, restaurants: newRestaurants },
                          });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Địa điểm</label>
                      <input
                        type="text"
                        value={restaurant.location || ''}
                        onChange={(e) => {
                          const newRestaurants = [...formData.suppliers.restaurants];
                          newRestaurants[index] = { ...newRestaurants[index], location: e.target.value };
                          setFormData({
                            ...formData,
                            suppliers: { ...formData.suppliers, restaurants: newRestaurants },
                          });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <button
                        type="button"
                        onClick={() => {
                          const newRestaurants = formData.suppliers.restaurants.filter((_, i) => i !== index);
                          setFormData({
                            ...formData,
                            suppliers: { ...formData.suppliers, restaurants: newRestaurants },
                          });
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    suppliers: {
                      ...formData.suppliers,
                      restaurants: [...formData.suppliers.restaurants, { name: '', location: '', cuisine: '' }],
                    },
                  });
                }}
                className="btn-add-item"
              >
                + Thêm nhà hàng
              </button>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-cancel">
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : tour ? 'Cập nhật' : 'Tạo Tour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TourForm;
