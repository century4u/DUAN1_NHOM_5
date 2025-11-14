import React, { useState, useEffect } from 'react';
import { tourVersionService, tourService } from '../../services/api';
import './TourVersionForm.css';

const TourVersionForm = ({ tour, version, onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [availableTours, setAvailableTours] = useState([]);
  const [formData, setFormData] = useState({
    tour: tour?._id || '',
    versionType: 'seasonal',
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'draft',
    
    // Seasonal
    seasonalInfo: {
      season: 'peak',
      peakMultiplier: 1.2,
    },
    
    // Promotion
    promotionInfo: {
      discountPercentage: 0,
      discountAmount: 0,
      bonusServices: [],
      promotionCode: '',
      minBookingDays: 0,
      maxParticipants: 0,
    },
    
    // Special
    specialInfo: {
      eventType: 'vip',
      eventName: '',
      isVIP: false,
      maxParticipants: 10,
      luxuryLevel: 5,
      exclusiveServices: [],
      requirements: '',
    },
    
    // Pricing
    pricing: {
      adult: 0,
      child: 0,
      infant: 0,
      senior: 0,
      basePrice: 0,
    },
    
    // Schedules
    schedules: [],
    
    // Services
    additionalServices: [],
    includedServices: [],
    excludedServices: [],
    
    notes: '',
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(null);

  useEffect(() => {
    if (version) {
      setFormData({
        tour: version.tour?._id || version.tour || '',
        versionType: version.versionType || 'seasonal',
        name: version.name || '',
        description: version.description || '',
        startDate: version.startDate ? new Date(version.startDate).toISOString().split('T')[0] : '',
        endDate: version.endDate ? new Date(version.endDate).toISOString().split('T')[0] : '',
        status: version.status || 'draft',
        seasonalInfo: version.seasonalInfo || { season: 'peak', peakMultiplier: 1.2 },
        promotionInfo: version.promotionInfo || { discountPercentage: 0, discountAmount: 0, bonusServices: [], promotionCode: '', minBookingDays: 0, maxParticipants: 0 },
        specialInfo: version.specialInfo || { eventType: 'vip', eventName: '', isVIP: false, maxParticipants: 10, luxuryLevel: 5, exclusiveServices: [], requirements: '' },
        pricing: version.pricing || { adult: 0, child: 0, infant: 0, senior: 0, basePrice: 0 },
        schedules: version.schedules || [],
        additionalServices: version.additionalServices || [],
        includedServices: version.includedServices || [],
        excludedServices: version.excludedServices || [],
        notes: version.notes || '',
      });
    }
    fetchTours();
  }, [version, tour]);

  const fetchTours = async () => {
    try {
      const response = await tourService.getAll();
      if (response.data.success) {
        setAvailableTours(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching tours:', err);
    }
  };

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
              [subSubChild]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value),
            },
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value),
          },
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value),
      }));
    }
  };

  const handleCalculatePrice = async () => {
    if (!formData.tour) {
      setError('Vui lòng chọn tour gốc');
      return;
    }

    try {
      const response = await tourVersionService.calculatePrice({
        tourId: formData.tour,
        versionType: formData.versionType,
        seasonalInfo: formData.seasonalInfo,
        promotionInfo: formData.promotionInfo,
      });

      if (response.data.success) {
        setCalculatedPrice(response.data.data);
        setFormData((prev) => ({
          ...prev,
          pricing: {
            ...prev.pricing,
            adult: response.data.data.calculatedPrice,
            basePrice: response.data.data.calculatedPrice,
          },
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tính giá');
    }
  };

  const handleAddSchedule = () => {
    setFormData((prev) => ({
      ...prev,
      schedules: [...prev.schedules, {
        departureDate: '',
        returnDate: '',
        availableSlots: 0,
        status: 'available',
      }],
    }));
  };

  const handleScheduleChange = (index, field, value) => {
    setFormData((prev) => {
      const newSchedules = [...prev.schedules];
      newSchedules[index] = { ...newSchedules[index], [field]: value };
      return { ...prev, schedules: newSchedules };
    });
  };

  const handleRemoveSchedule = (index) => {
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index),
    }));
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

  const handleArrayChange = (field, index, value) => {
    setFormData((prev) => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        schedules: formData.schedules.map(s => ({
          ...s,
          departureDate: new Date(s.departureDate),
          returnDate: new Date(s.returnDate),
        })),
      };

      if (version) {
        await tourVersionService.update(version._id, data);
      } else {
        await tourVersionService.create(data);
      }

      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu version');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="tour-version-form-overlay" onClick={onClose}>
      <div className="tour-version-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tour-version-form-header">
          <h2>{version ? 'Sửa Version' : 'Tạo Version Mới'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Progress Steps */}
        <div className="steps-progress">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`step-item ${step >= s ? 'active' : ''} ${step === s ? 'current' : ''}`}>
              <div className="step-number">{s}</div>
              <div className="step-label">
                {s === 1 && 'Cơ bản'}
                {s === 2 && 'Loại Version'}
                {s === 3 && 'Giá & Lịch'}
                {s === 4 && 'Dịch vụ'}
                {s === 5 && 'Xác nhận'}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="tour-version-form">
          {error && <div className="error-message">{error}</div>}

          {/* Step 1: Thông tin cơ bản */}
          {step === 1 && (
            <div className="step-content">
              <h3>Thông tin cơ bản</h3>
              
              <div className="form-group">
                <label>Tour gốc *</label>
                <select
                  name="tour"
                  value={formData.tour}
                  onChange={handleChange}
                  required
                  disabled={!!tour}
                >
                  <option value="">Chọn tour gốc</option>
                  {availableTours.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} - {t.destination}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Loại Version *</label>
                <select
                  name="versionType"
                  value={formData.versionType}
                  onChange={handleChange}
                  required
                >
                  <option value="seasonal">Theo mùa (Seasonal)</option>
                  <option value="promotion">Khuyến mãi (Promotion)</option>
                  <option value="special">Đặc biệt (Special)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tên Version *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="VD: Tour mùa cao điểm, Tour khuyến mãi 30%..."
                />
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Mô tả về version này..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngày bắt đầu *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ngày kết thúc *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Trạng thái *</label>
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
          )}

          {/* Step 2: Cấu hình theo loại version */}
          {step === 2 && (
            <div className="step-content">
              <h3>Cấu hình {formData.versionType === 'seasonal' ? 'Mùa' : formData.versionType === 'promotion' ? 'Khuyến mãi' : 'Đặc biệt'}</h3>

              {formData.versionType === 'seasonal' && (
                <>
                  <div className="form-group">
                    <label>Mùa *</label>
                    <select
                      name="seasonalInfo.season"
                      value={formData.seasonalInfo.season}
                      onChange={handleChange}
                      required
                    >
                      <option value="peak">Cao điểm</option>
                      <option value="off-peak">Thấp điểm</option>
                      <option value="shoulder">Trung bình</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Hệ số nhân giá (VD: 1.2 = tăng 20%) *</label>
                    <input
                      type="number"
                      name="seasonalInfo.peakMultiplier"
                      value={formData.seasonalInfo.peakMultiplier}
                      onChange={handleChange}
                      step="0.1"
                      min="0.1"
                      required
                    />
                  </div>
                </>
              )}

              {formData.versionType === 'promotion' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>% Giảm giá</label>
                      <input
                        type="number"
                        name="promotionInfo.discountPercentage"
                        value={formData.promotionInfo.discountPercentage}
                        onChange={handleChange}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="form-group">
                      <label>Số tiền giảm (VNĐ)</label>
                      <input
                        type="number"
                        name="promotionInfo.discountAmount"
                        value={formData.promotionInfo.discountAmount}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Mã khuyến mãi</label>
                    <input
                      type="text"
                      name="promotionInfo.promotionCode"
                      value={formData.promotionInfo.promotionCode}
                      onChange={handleChange}
                      placeholder="VD: SUMMER2024"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Số ngày đặt trước tối thiểu</label>
                      <input
                        type="number"
                        name="promotionInfo.minBookingDays"
                        value={formData.promotionInfo.minBookingDays}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Số lượng khách tối đa</label>
                      <input
                        type="number"
                        name="promotionInfo.maxParticipants"
                        value={formData.promotionInfo.maxParticipants}
                        onChange={handleChange}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Dịch vụ bổ sung miễn phí</label>
                    {formData.promotionInfo.bonusServices.map((service, index) => (
                      <div key={index} className="array-item">
                        <input
                          type="text"
                          value={service}
                          onChange={(e) => {
                            const newServices = [...formData.promotionInfo.bonusServices];
                            newServices[index] = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              promotionInfo: { ...prev.promotionInfo, bonusServices: newServices }
                            }));
                          }}
                          placeholder="Dịch vụ bổ sung"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newServices = formData.promotionInfo.bonusServices.filter((_, i) => i !== index);
                            setFormData(prev => ({
                              ...prev,
                              promotionInfo: { ...prev.promotionInfo, bonusServices: newServices }
                            }));
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          promotionInfo: {
                            ...prev.promotionInfo,
                            bonusServices: [...prev.promotionInfo.bonusServices, '']
                          }
                        }));
                      }}
                      className="btn-add-item"
                    >
                      + Thêm dịch vụ
                    </button>
                  </div>
                </>
              )}

              {formData.versionType === 'special' && (
                <>
                  <div className="form-group">
                    <label>Loại sự kiện *</label>
                    <select
                      name="specialInfo.eventType"
                      value={formData.specialInfo.eventType}
                      onChange={handleChange}
                      required
                    >
                      <option value="vip">VIP</option>
                      <option value="holiday">Dịp lễ</option>
                      <option value="event">Sự kiện</option>
                      <option value="custom">Tùy chỉnh</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tên sự kiện</label>
                    <input
                      type="text"
                      name="specialInfo.eventName"
                      value={formData.specialInfo.eventName}
                      onChange={handleChange}
                      placeholder="VD: Tour VIP Tết Nguyên Đán..."
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="specialInfo.isVIP"
                        checked={formData.specialInfo.isVIP}
                        onChange={handleChange}
                      />
                      Tour VIP
                    </label>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Số lượng tối đa *</label>
                      <input
                        type="number"
                        name="specialInfo.maxParticipants"
                        value={formData.specialInfo.maxParticipants}
                        onChange={handleChange}
                        min="1"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Mức độ sang trọng (1-5 sao) *</label>
                      <input
                        type="number"
                        name="specialInfo.luxuryLevel"
                        value={formData.specialInfo.luxuryLevel}
                        onChange={handleChange}
                        min="1"
                        max="5"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Yêu cầu đặc biệt</label>
                    <textarea
                      name="specialInfo.requirements"
                      value={formData.specialInfo.requirements}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Yêu cầu đặc biệt cho tour này..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Dịch vụ độc quyền</label>
                    {formData.specialInfo.exclusiveServices.map((service, index) => (
                      <div key={index} className="array-item">
                        <input
                          type="text"
                          value={service}
                          onChange={(e) => {
                            const newServices = [...formData.specialInfo.exclusiveServices];
                            newServices[index] = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              specialInfo: { ...prev.specialInfo, exclusiveServices: newServices }
                            }));
                          }}
                          placeholder="Dịch vụ độc quyền"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newServices = formData.specialInfo.exclusiveServices.filter((_, i) => i !== index);
                            setFormData(prev => ({
                              ...prev,
                              specialInfo: { ...prev.specialInfo, exclusiveServices: newServices }
                            }));
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          specialInfo: {
                            ...prev.specialInfo,
                            exclusiveServices: [...prev.specialInfo.exclusiveServices, '']
                          }
                        }));
                      }}
                      className="btn-add-item"
                    >
                      + Thêm dịch vụ
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Giá cả và lịch khởi hành */}
          {step === 3 && (
            <div className="step-content">
              <h3>Giá cả và lịch khởi hành</h3>

              <div className="price-calculation-section">
                <button
                  type="button"
                  onClick={handleCalculatePrice}
                  className="btn btn-secondary"
                >
                  Tính giá tự động
                </button>
                {calculatedPrice && (
                  <div className="price-result">
                    <div>Giá gốc: {new Intl.NumberFormat('vi-VN').format(calculatedPrice.originalPrice)} VNĐ</div>
                    <div>Giá sau tính toán: {new Intl.NumberFormat('vi-VN').format(calculatedPrice.calculatedPrice)} VNĐ</div>
                    <div>Giảm: {new Intl.NumberFormat('vi-VN').format(calculatedPrice.discount)} VNĐ</div>
                  </div>
                )}
              </div>

              <div className="section-title">Giá theo đối tượng</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Người lớn (VNĐ) *</label>
                  <input
                    type="number"
                    name="pricing.adult"
                    value={formData.pricing.adult}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Trẻ em (VNĐ)</label>
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
                  <label>Em bé (VNĐ)</label>
                  <input
                    type="number"
                    name="pricing.infant"
                    value={formData.pricing.infant}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Người cao tuổi (VNĐ)</label>
                  <input
                    type="number"
                    name="pricing.senior"
                    value={formData.pricing.senior}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Giá cơ bản (VNĐ) *</label>
                <input
                  type="number"
                  name="pricing.basePrice"
                  value={formData.pricing.basePrice}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>

              <div className="section-title">Lịch khởi hành</div>
              {formData.schedules.map((schedule, index) => (
                <div key={index} className="schedule-item">
                  <div className="schedule-header">
                    <h4>Chuyến {index + 1}</h4>
                    <button type="button" onClick={() => handleRemoveSchedule(index)}>
                      Xóa
                    </button>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Ngày khởi hành *</label>
                      <input
                        type="date"
                        value={schedule.departureDate}
                        onChange={(e) => handleScheduleChange(index, 'departureDate', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Ngày về *</label>
                      <input
                        type="date"
                        value={schedule.returnDate}
                        onChange={(e) => handleScheduleChange(index, 'returnDate', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Số chỗ trống *</label>
                      <input
                        type="number"
                        value={schedule.availableSlots}
                        onChange={(e) => handleScheduleChange(index, 'availableSlots', parseInt(e.target.value) || 0)}
                        min="0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Trạng thái</label>
                      <select
                        value={schedule.status}
                        onChange={(e) => handleScheduleChange(index, 'status', e.target.value)}
                      >
                        <option value="available">Còn chỗ</option>
                        <option value="full">Hết chỗ</option>
                        <option value="closed">Đóng</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddSchedule}
                className="btn-add-item"
              >
                + Thêm lịch khởi hành
              </button>
            </div>
          )}

          {/* Step 4: Dịch vụ */}
          {step === 4 && (
            <div className="step-content">
              <h3>Dịch vụ</h3>

              <div className="section-title">Dịch vụ bao gồm</div>
              {formData.includedServices.map((service, index) => (
                <div key={index} className="array-item">
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => handleArrayChange('includedServices', index, e.target.value)}
                    placeholder="Dịch vụ bao gồm"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveArrayItem('includedServices', index)}
                  >
                    Xóa
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddArrayItem('includedServices')}
                className="btn-add-item"
              >
                + Thêm dịch vụ
              </button>

              <div className="section-title">Dịch vụ không bao gồm</div>
              {formData.excludedServices.map((service, index) => (
                <div key={index} className="array-item">
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => handleArrayChange('excludedServices', index, e.target.value)}
                    placeholder="Dịch vụ không bao gồm"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveArrayItem('excludedServices', index)}
                  >
                    Xóa
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddArrayItem('excludedServices')}
                className="btn-add-item"
              >
                + Thêm dịch vụ
              </button>

              <div className="section-title">Dịch vụ bổ sung</div>
              {formData.additionalServices.map((service, index) => (
                <div key={index} className="additional-service-item">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tên dịch vụ</label>
                      <input
                        type="text"
                        value={service.name || ''}
                        onChange={(e) => {
                          const newServices = [...formData.additionalServices];
                          newServices[index] = { ...newServices[index], name: e.target.value };
                          setFormData(prev => ({ ...prev, additionalServices: newServices }));
                        }}
                        placeholder="Tên dịch vụ"
                      />
                    </div>
                    <div className="form-group">
                      <label>Giá (VNĐ)</label>
                      <input
                        type="number"
                        value={service.price || 0}
                        onChange={(e) => {
                          const newServices = [...formData.additionalServices];
                          newServices[index] = { ...newServices[index], price: parseFloat(e.target.value) || 0 };
                          setFormData(prev => ({ ...prev, additionalServices: newServices }));
                        }}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={service.included || false}
                        onChange={(e) => {
                          const newServices = [...formData.additionalServices];
                          newServices[index] = { ...newServices[index], included: e.target.checked };
                          setFormData(prev => ({ ...prev, additionalServices: newServices }));
                        }}
                      />
                      Bao gồm trong giá
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveArrayItem('additionalServices', index)}
                    className="btn-remove"
                  >
                    Xóa dịch vụ
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddArrayItem('additionalServices', { name: '', price: 0, included: false })}
                className="btn-add-item"
              >
                + Thêm dịch vụ bổ sung
              </button>

              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Ghi chú thêm về version này..."
                />
              </div>
            </div>
          )}

          {/* Step 5: Xác nhận */}
          {step === 5 && (
            <div className="step-content">
              <h3>Xác nhận thông tin</h3>
              <div className="summary-section">
                <div className="summary-item">
                  <label>Tour gốc:</label>
                  <div>{availableTours.find(t => t._id === formData.tour)?.name || 'N/A'}</div>
                </div>
                <div className="summary-item">
                  <label>Loại version:</label>
                  <div>
                    {formData.versionType === 'seasonal' && 'Theo mùa'}
                    {formData.versionType === 'promotion' && 'Khuyến mãi'}
                    {formData.versionType === 'special' && 'Đặc biệt'}
                  </div>
                </div>
                <div className="summary-item">
                  <label>Tên version:</label>
                  <div>{formData.name}</div>
                </div>
                <div className="summary-item">
                  <label>Thời gian:</label>
                  <div>{formData.startDate} đến {formData.endDate}</div>
                </div>
                <div className="summary-item">
                  <label>Giá người lớn:</label>
                  <div>{new Intl.NumberFormat('vi-VN').format(formData.pricing.adult)} VNĐ</div>
                </div>
                <div className="summary-item">
                  <label>Số lịch khởi hành:</label>
                  <div>{formData.schedules.length} chuyến</div>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <div className="form-actions-left">
              {step > 1 && (
                <button type="button" onClick={prevStep} className="btn btn-secondary">
                  ← Quay lại
                </button>
              )}
            </div>
            <div className="form-actions-right">
              {step < 5 ? (
                <button type="button" onClick={nextStep} className="btn btn-primary">
                  Tiếp theo →
                </button>
              ) : (
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang lưu...' : version ? 'Cập nhật' : 'Tạo Version'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TourVersionForm;

