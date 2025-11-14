const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên tour là bắt buộc'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Mô tả tour là bắt buộc'],
  },
  category: {
    type: String,
    enum: ['domestic', 'international', 'custom'],
    required: [true, 'Loại tour là bắt buộc'],
  },
  categoryLabel: {
    type: String,
    enum: ['Tour trong nước', 'Tour quốc tế', 'Tour theo yêu cầu'],
    required: true,
  },
  price: {
    type: Number,
    required: [true, 'Giá tour là bắt buộc'],
    min: [0, 'Giá tour không được âm'],
  },
  // Giá theo đối tượng
  pricing: {
    adult: {
      type: Number,
      default: 0,
    },
    child: {
      type: Number,
      default: 0,
    },
    infant: {
      type: Number,
      default: 0,
    },
    senior: {
      type: Number,
      default: 0,
    },
  },
  // Giá theo thời điểm (mùa cao điểm/thấp điểm)
  seasonalPricing: [{
    period: {
      startDate: Date,
      endDate: Date,
    },
    name: String, // VD: "Mùa cao điểm", "Mùa lễ hội"
    adultPrice: Number,
    childPrice: Number,
    infantPrice: Number,
    seniorPrice: Number,
  }],
  // Các gói dịch vụ kèm theo
  servicePackages: [{
    name: String, // VD: "Gói VIP", "Gói Standard"
    description: String,
    price: Number,
    features: [String], // Các tính năng của gói
  }],
  duration: {
    type: Number, // Số ngày
    required: [true, 'Thời gian tour là bắt buộc'],
    min: [1, 'Thời gian tour tối thiểu là 1 ngày'],
  },
  destination: {
    type: String,
    required: [true, 'Điểm đến là bắt buộc'],
    trim: true,
  },
  images: [{
    type: String,
    default: [],
  }],
  itinerary: [{
    day: {
      type: Number,
      required: true,
    },
    date: Date, // Ngày cụ thể
    time: String, // Giờ (VD: "08:00", "14:30")
    title: {
      type: String,
      required: true,
    },
    description: String,
    location: String, // Địa điểm
    attractions: [{ // Các điểm tham quan
      name: String,
      description: String,
      visitDuration: String, // Thời gian tham quan (VD: "2 giờ")
    }],
    activities: [{
      time: String,
      activity: String,
      description: String,
    }],
    meals: [{
      type: String, // breakfast, lunch, dinner
      name: String,
      location: String,
    }],
    accommodation: {
      hotel: String,
      location: String,
      roomType: String,
    },
  }],
  included: [{
    type: String, // Dịch vụ bao gồm
  }],
  excluded: [{
    type: String, // Dịch vụ không bao gồm
  }],
  maxParticipants: {
    type: Number,
    default: 50,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'draft',
  },
  isCustom: {
    type: Boolean,
    default: false, // true nếu là tour theo yêu cầu
  },
  customRequirements: {
    type: String, // Yêu cầu riêng cho tour custom
  },
  // Chính sách tour
  policies: {
    booking: {
      advanceBookingDays: Number, // Số ngày đặt trước tối thiểu
      description: String, // Mô tả chính sách đặt tour
    },
    cancellation: {
      freeCancellationDays: Number, // Số ngày hủy miễn phí
      cancellationFee: Number, // Phí hủy (%)
      description: String, // Mô tả chính sách hủy tour
      terms: [String], // Điều khoản hủy tour
    },
    rescheduling: {
      allowed: Boolean,
      fee: Number, // Phí đổi lịch
      advanceNoticeDays: Number, // Số ngày báo trước
      description: String,
    },
    refund: {
      refundable: Boolean,
      refundPercentage: Number, // % hoàn tiền
      refundTimeframe: String, // Thời gian hoàn tiền (VD: "7-14 ngày làm việc")
      description: String,
    },
    terms: String, // Các điều khoản chung
    specialTerms: String, // Điều khoản riêng cho tour
  },
  // Nhà cung cấp dịch vụ
  suppliers: {
    hotels: [{
      name: String,
      location: String,
      rating: Number, // Xếp hạng sao
      contact: {
        phone: String,
        email: String,
      },
      description: String,
    }],
    transportation: [{
      type: String, // "xe", "máy bay", "tàu", "thuyền"
      provider: String, // Tên nhà cung cấp
      vehicleType: String, // Loại xe (VD: "Xe 16 chỗ", "Xe bus 45 chỗ")
      contact: {
        phone: String,
        email: String,
      },
      description: String,
    }],
    restaurants: [{
      name: String,
      location: String,
      cuisine: String, // Loại ẩm thực
      contact: {
        phone: String,
        email: String,
      },
      description: String,
    }],
    guides: [{
      name: String,
      language: [String], // Ngôn ngữ hỗ trợ
      rating: Number,
      contact: {
        phone: String,
        email: String,
      },
      description: String,
    }],
    otherSuppliers: [{
      type: String, // Loại dịch vụ
      name: String,
      description: String,
      contact: {
        phone: String,
        email: String,
      },
    }],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Index để tìm kiếm nhanh theo category
tourSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Tour', tourSchema);

