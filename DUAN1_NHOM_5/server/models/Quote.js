const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  // Thông tin tour
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: [true, 'Tour là bắt buộc'],
  },
  
  // Tour version (nếu có)
  tourVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TourVersion',
    default: null,
  },
  
  // Số báo giá
  quoteNumber: {
    type: String,
    unique: true,
    required: true,
  },
  
  // Thông tin khách hàng
  customer: {
    name: {
      type: String,
      required: [true, 'Tên khách hàng là bắt buộc'],
      trim: true,
    },
    company: String, // Tên công ty (nếu có)
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại là bắt buộc'],
      trim: true,
    },
    address: String, // Địa chỉ
    zalo: String, // Số Zalo (nếu có)
  },
  
  // Thông tin đoàn khách
  groupInfo: {
    totalParticipants: {
      type: Number,
      required: [true, 'Số lượng khách là bắt buộc'],
      min: 1,
    },
    adults: {
      type: Number,
      default: 0,
      min: 0,
    },
    children: {
      type: Number,
      default: 0,
      min: 0,
    },
    infants: {
      type: Number,
      default: 0,
      min: 0,
    },
    seniors: {
      type: Number,
      default: 0,
      min: 0,
    },
    departureDate: Date, // Ngày khởi hành mong muốn
    returnDate: Date, // Ngày về
    notes: String, // Ghi chú đặc biệt
  },
  
  // Dịch vụ đã chọn
  selectedServices: [{
    serviceId: String, // ID dịch vụ (từ tour hoặc version)
    serviceName: String, // Tên dịch vụ
    serviceType: {
      type: String,
      enum: ['additional', 'upgrade', 'custom'],
    }, // Loại dịch vụ
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    description: String, // Mô tả dịch vụ
  }],
  
  // Tính toán giá
  pricing: {
    // Giá tour cơ bản
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Giá theo đối tượng
    adultsPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    childrenPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    infantsPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    seniorsPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Tổng giá tour
    tourSubtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Tổng giá dịch vụ bổ sung
    servicesSubtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Giảm giá (nếu có)
    discount: {
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      reason: String, // Lý do giảm giá
    },
    
    // Tổng tiền
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // VAT (nếu có)
    vat: {
      percentage: {
        type: Number,
        default: 10,
        min: 0,
        max: 100,
      },
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    
    // Tổng thanh toán cuối cùng
    finalTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  
  // Điều khoản và điều kiện
  terms: {
    validity: {
      type: Number,
      default: 7,
    }, // Số ngày hiệu lực (mặc định 7 ngày)
    paymentTerms: String, // Điều khoản thanh toán
    cancellationPolicy: String, // Chính sách hủy
    notes: String, // Ghi chú thêm
  },
  
  // Trạng thái
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
    default: 'draft',
  },
  
  // Thông tin gửi
  sentInfo: {
    sentAt: Date, // Thời gian gửi
    sentBy: String, // Người gửi
    sentVia: {
      type: String,
      enum: ['email', 'zalo', 'both', 'manual'],
    }, // Phương thức gửi
    emailSent: {
      type: Boolean,
      default: false,
    },
    zaloSent: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    }, // Số lần xem
    lastViewedAt: Date, // Lần xem cuối
  },
  
  // Ghi chú nội bộ
  internalNotes: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
quoteSchema.index({ quoteNumber: 1 });
quoteSchema.index({ tour: 1, status: 1 });
quoteSchema.index({ 'customer.email': 1 });
quoteSchema.index({ createdAt: -1 });

// Auto generate quote number
quoteSchema.pre('save', async function(next) {
  if (!this.quoteNumber) {
    const Quote = mongoose.model('Quote');
    const count = await Quote.countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.quoteNumber = `QT${year}${month}${String(count + 1).padStart(4, '0')}`;
  }
  
  // Auto calculate totals
  if (this.groupInfo && this.pricing) {
    // Calculate tour subtotal
    const tourSubtotal = 
      (this.groupInfo.adults || 0) * (this.pricing.adultsPrice || 0) +
      (this.groupInfo.children || 0) * (this.pricing.childrenPrice || 0) +
      (this.groupInfo.infants || 0) * (this.pricing.infantsPrice || 0) +
      (this.groupInfo.seniors || 0) * (this.pricing.seniorsPrice || 0);
    
    this.pricing.tourSubtotal = tourSubtotal;
    
    // Calculate services subtotal
    const servicesSubtotal = this.selectedServices.reduce((sum, service) => {
      return sum + (service.totalPrice || 0);
    }, 0);
    
    this.pricing.servicesSubtotal = servicesSubtotal;
    
    // Calculate total before discount
    const totalBeforeDiscount = tourSubtotal + servicesSubtotal;
    
    // Apply discount
    let discountAmount = 0;
    if (this.pricing.discount.percentage > 0) {
      discountAmount = Math.round(totalBeforeDiscount * (this.pricing.discount.percentage / 100));
    } else if (this.pricing.discount.amount > 0) {
      discountAmount = this.pricing.discount.amount;
    }
    
    this.pricing.discount.amount = discountAmount;
    this.pricing.total = totalBeforeDiscount - discountAmount;
    
    // Calculate VAT
    const vatAmount = Math.round(this.pricing.total * (this.pricing.vat.percentage / 100));
    this.pricing.vat.amount = vatAmount;
    
    // Final total
    this.pricing.finalTotal = this.pricing.total + vatAmount;
  }
  
  next();
});

module.exports = mongoose.model('Quote', quoteSchema);

