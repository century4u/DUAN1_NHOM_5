import React, { useState, useEffect } from 'react';
import { quoteService, tourService, tourVersionService } from '../../services/api';
import './QuickQuoteForm.css';

const QuickQuoteForm = ({ onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [tours, setTours] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  
  const [formData, setFormData] = useState({
    tourId: '',
    tourVersionId: '',
    customer: {
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      zalo: '',
    },
    groupInfo: {
      totalParticipants: 1,
      adults: 1,
      children: 0,
      infants: 0,
      seniors: 0,
      departureDate: '',
      returnDate: '',
      notes: '',
    },
    selectedServices: [],
    discount: {
      amount: 0,
      percentage: 0,
      reason: '',
    },
  });

  useEffect(() => {
    fetchTours();
  }, []);

  useEffect(() => {
    if (formData.tourId) {
      fetchVersions(formData.tourId);
      calculatePrice();
    }
  }, [formData.tourId, formData.tourVersionId, formData.groupInfo, formData.selectedServices]);

  const fetchTours = async () => {
    try {
      const response = await tourService.getAll({ status: 'active' });
      if (response.data.success) {
        setTours(response.data.data || []);
      }
    } catch (err) {
      setError('Lỗi khi tải danh sách tour');
    }
  };

  const fetchVersions = async (tourId) => {
    try {
      const response = await tourVersionService.getByTour(tourId);
      if (response.data.success) {
        setVersions(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching versions:', err);
    }
  };

  const calculatePrice = async () => {
    if (!formData.tourId || !formData.groupInfo.totalParticipants) return;

    try {
      const response = await quoteService.quickCalculate({
        tourId: formData.tourId,
        tourVersionId: formData.tourVersionId || null,
        groupInfo: formData.groupInfo,
        selectedServices: formData.selectedServices,
      });
      
      if (response.data.success) {
        let pricing = response.data.data;
        
        // Apply discount
        if (formData.discount.percentage > 0) {
          const discountAmount = Math.round(pricing.total * (formData.discount.percentage / 100));
          pricing.discount.amount = discountAmount;
          pricing.discount.percentage = formData.discount.percentage;
          pricing.total -= discountAmount;
          pricing.finalTotal = pricing.total + pricing.vat.amount;
        } else if (formData.discount.amount > 0) {
          pricing.discount.amount = formData.discount.amount;
          pricing.total -= formData.discount.amount;
          pricing.finalTotal = pricing.total + pricing.vat.amount;
        }
        
        setCalculatedPrice(pricing);
      }
    } catch (err) {
      console.error('Error calculating price:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'number' ? parseFloat(value) || 0 : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const handleGroupInfoChange = (field, value) => {
    // Auto calculate total participants
    if (field === 'adults' || field === 'children' || field === 'infants' || field === 'seniors') {
      setFormData((prev) => {
        const adults = field === 'adults' ? value : prev.groupInfo.adults || 0;
        const children = field === 'children' ? value : prev.groupInfo.children || 0;
        const infants = field === 'infants' ? value : prev.groupInfo.infants || 0;
        const seniors = field === 'seniors' ? value : prev.groupInfo.seniors || 0;
        
        return {
          ...prev,
          groupInfo: {
            ...prev.groupInfo,
            totalParticipants: adults + children + infants + seniors,
            [field]: value,
          },
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        groupInfo: {
          ...prev.groupInfo,
          [field]: value,
        },
      }));
    }
  };

  const handleAddService = () => {
    setFormData((prev) => ({
      ...prev,
      selectedServices: [...prev.selectedServices, {
        serviceName: '',
        serviceType: 'additional',
        quantity: 1,
        unitPrice: 0,
        description: '',
      }],
    }));
  };

  const handleServiceChange = (index, field, value) => {
    setFormData((prev) => {
      const newServices = [...prev.selectedServices];
      newServices[index] = { ...newServices[index], [field]: value };
      
      // Auto calculate total price
      if (field === 'quantity' || field === 'unitPrice') {
        newServices[index].totalPrice = (newServices[index].quantity || 1) * (newServices[index].unitPrice || 0);
      }
      
      return { ...prev, selectedServices: newServices };
    });
  };

  const handleRemoveService = (index) => {
    setFormData((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const quoteData = {
        tourId: formData.tourId,
        tourVersionId: formData.tourVersionId || null,
        customer: formData.customer,
        groupInfo: formData.groupInfo,
        selectedServices: formData.selectedServices,
      };

      const response = await quoteService.create(quoteData);
      
      if (response.data.success) {
        onSave(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tạo báo giá');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price || 0);
  };

  const selectedTour = tours.find(t => t._id === formData.tourId);

  return (
    <div className="quick-quote-overlay" onClick={onClose}>
      <div className="quick-quote-modal" onClick={(e) => e.stopPropagation()}>
        <div className="quick-quote-header">
          <h2>Tạo Báo Giá Nhanh</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="quick-quote-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step === 1 ? 'current' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Tour & Khách</div>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step === 2 ? 'current' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Dịch vụ</div>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''} ${step === 3 ? 'current' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Xác nhận</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="quick-quote-form">
          {error && <div className="error-message">{error}</div>}

          {/* Step 1: Tour & Khách hàng */}
          {step === 1 && (
            <div className="step-content">
              <h3>Chọn Tour & Thông tin Khách hàng</h3>

              <div className="form-group">
                <label>Chọn Tour *</label>
                <select
                  name="tourId"
                  value={formData.tourId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn tour --</option>
                  {tours.map((tour) => (
                    <option key={tour._id} value={tour._id}>
                      {tour.name} - {tour.destination}
                    </option>
                  ))}
                </select>
              </div>

              {versions.length > 0 && (
                <div className="form-group">
                  <label>Chọn Version (tùy chọn)</label>
                  <select
                    name="tourVersionId"
                    value={formData.tourVersionId}
                    onChange={handleChange}
                  >
                    <option value="">-- Chọn version --</option>
                    {versions.map((version) => (
                      <option key={version._id} value={version._id}>
                        {version.name} ({version.versionType})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="section-title">Thông tin Khách hàng</div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Tên khách hàng *</label>
                  <input
                    type="text"
                    name="customer.name"
                    value={formData.customer.name}
                    onChange={handleChange}
                    required
                    placeholder="Nhập tên khách hàng"
                  />
                </div>
                <div className="form-group">
                  <label>Công ty (nếu có)</label>
                  <input
                    type="text"
                    name="customer.company"
                    value={formData.customer.company}
                    onChange={handleChange}
                    placeholder="Tên công ty"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="customer.email"
                    value={formData.customer.email}
                    onChange={handleChange}
                    required
                    placeholder="email@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    name="customer.phone"
                    value={formData.customer.phone}
                    onChange={handleChange}
                    required
                    placeholder="0123456789"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Zalo (nếu có)</label>
                <input
                  type="text"
                  name="customer.zalo"
                  value={formData.customer.zalo}
                  onChange={handleChange}
                  placeholder="Số Zalo"
                />
              </div>

              <div className="section-title">Thông tin Đoàn khách</div>

              <div className="form-row">
                <div className="form-group">
                  <label>Người lớn *</label>
                  <input
                    type="number"
                    value={formData.groupInfo.adults}
                    onChange={(e) => handleGroupInfoChange('adults', parseInt(e.target.value) || 0)}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Trẻ em</label>
                  <input
                    type="number"
                    value={formData.groupInfo.children}
                    onChange={(e) => handleGroupInfoChange('children', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Em bé</label>
                  <input
                    type="number"
                    value={formData.groupInfo.infants}
                    onChange={(e) => handleGroupInfoChange('infants', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Người cao tuổi</label>
                  <input
                    type="number"
                    value={formData.groupInfo.seniors}
                    onChange={(e) => handleGroupInfoChange('seniors', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tổng số khách: <strong>{formData.groupInfo.totalParticipants}</strong></label>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngày khởi hành</label>
                  <input
                    type="date"
                    name="groupInfo.departureDate"
                    value={formData.groupInfo.departureDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Ngày về</label>
                  <input
                    type="date"
                    name="groupInfo.returnDate"
                    value={formData.groupInfo.returnDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Dịch vụ & Giảm giá */}
          {step === 2 && (
            <div className="step-content">
              <h3>Dịch vụ bổ sung & Giảm giá</h3>

              <div className="section-title">Dịch vụ bổ sung</div>
              {formData.selectedServices.map((service, index) => (
                <div key={index} className="service-item">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tên dịch vụ</label>
                      <input
                        type="text"
                        value={service.serviceName}
                        onChange={(e) => handleServiceChange(index, 'serviceName', e.target.value)}
                        placeholder="Tên dịch vụ"
                      />
                    </div>
                    <div className="form-group">
                      <label>Số lượng</label>
                      <input
                        type="number"
                        value={service.quantity}
                        onChange={(e) => handleServiceChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Đơn giá (VNĐ)</label>
                      <input
                        type="number"
                        value={service.unitPrice}
                        onChange={(e) => handleServiceChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Thành tiền</label>
                      <input
                        type="text"
                        value={`${formatPrice(service.totalPrice || 0)} VNĐ`}
                        readOnly
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveService(index)}
                    className="btn-remove"
                  >
                    Xóa dịch vụ
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddService}
                className="btn-add-item"
              >
                + Thêm dịch vụ
              </button>

              <div className="section-title">Giảm giá (tùy chọn)</div>
              <div className="form-row">
                <div className="form-group">
                  <label>% Giảm giá</label>
                  <input
                    type="number"
                    value={formData.discount.percentage}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        discount: {
                          ...prev.discount,
                          percentage: parseFloat(e.target.value) || 0,
                          amount: 0,
                        },
                      }));
                    }}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label>Hoặc Số tiền giảm (VNĐ)</label>
                  <input
                    type="number"
                    value={formData.discount.amount}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        discount: {
                          ...prev.discount,
                          amount: parseFloat(e.target.value) || 0,
                          percentage: 0,
                        },
                      }));
                    }}
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Xác nhận & Tổng kết */}
          {step === 3 && (
            <div className="step-content">
              <h3>Xác nhận & Tổng kết</h3>

              {calculatedPrice && (
                <div className="price-summary">
                  <div className="summary-section">
                    <h4>Thông tin Tour</h4>
                    <div className="summary-item">
                      <label>Tour:</label>
                      <div>{selectedTour?.name || 'N/A'}</div>
                    </div>
                    <div className="summary-item">
                      <label>Điểm đến:</label>
                      <div>{selectedTour?.destination || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="summary-section">
                    <h4>Thông tin Khách hàng</h4>
                    <div className="summary-item">
                      <label>Tên:</label>
                      <div>{formData.customer.name}</div>
                    </div>
                    <div className="summary-item">
                      <label>Email:</label>
                      <div>{formData.customer.email}</div>
                    </div>
                    <div className="summary-item">
                      <label>Số điện thoại:</label>
                      <div>{formData.customer.phone}</div>
                    </div>
                  </div>

                  <div className="summary-section">
                    <h4>Tổng kết giá</h4>
                    <div className="price-breakdown">
                      <div className="price-row">
                        <label>Giá tour cơ bản:</label>
                        <div>{formatPrice(calculatedPrice.basePrice)} VNĐ</div>
                      </div>
                      <div className="price-row">
                        <label>Tổng giá tour:</label>
                        <div>{formatPrice(calculatedPrice.tourSubtotal)} VNĐ</div>
                      </div>
                      <div className="price-row">
                        <label>Dịch vụ bổ sung:</label>
                        <div>{formatPrice(calculatedPrice.servicesSubtotal)} VNĐ</div>
                      </div>
                      {calculatedPrice.discount.amount > 0 && (
                        <div className="price-row discount">
                          <label>Giảm giá:</label>
                          <div>- {formatPrice(calculatedPrice.discount.amount)} VNĐ</div>
                        </div>
                      )}
                      <div className="price-row">
                        <label>Tổng tiền:</label>
                        <div>{formatPrice(calculatedPrice.total)} VNĐ</div>
                      </div>
                      <div className="price-row">
                        <label>VAT (10%):</label>
                        <div>{formatPrice(calculatedPrice.vat.amount)} VNĐ</div>
                      </div>
                      <div className="price-row total">
                        <label>Tổng thanh toán:</label>
                        <div>{formatPrice(calculatedPrice.finalTotal)} VNĐ</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <div className="form-actions-left">
              {step > 1 && (
                <button type="button" onClick={() => setStep(step - 1)} className="btn btn-secondary">
                  ← Quay lại
                </button>
              )}
            </div>
            <div className="form-actions-right">
              {step < 3 ? (
                <button type="button" onClick={() => setStep(step + 1)} className="btn btn-primary">
                  Tiếp theo →
                </button>
              ) : (
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang tạo...' : 'Tạo Báo Giá'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickQuoteForm;

