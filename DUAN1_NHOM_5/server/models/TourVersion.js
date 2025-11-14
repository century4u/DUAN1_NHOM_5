const mongoose = require('mongoose');

const tourVersionSchema = new mongoose.Schema({
  // Liên kết với tour gốc
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: [true, 'Tour gốc là bắt buộc'],
  },
  
  // Loại version: seasonal, promotion, special
  versionType: {
    type: String,
    enum: ['seasonal', 'promotion', 'special'],
    required: [true, 'Loại version là bắt buộc'],
  },
  
  // Thông tin version
  name: {
    type: String,
    required: [true, 'Tên version là bắt buộc'],
    trim: true,
  },
  
  description: {
    type: String,
    default: '',
  },
  
  // Thời gian áp dụng
  startDate: {
    type: Date,
    required: [true, 'Ngày bắt đầu là bắt buộc'],
  },
  
  endDate: {
    type: Date,
    required: [true, 'Ngày kết thúc là bắt buộc'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'Ngày kết thúc phải sau ngày bắt đầu',
    },
  },
  
  // Seasonal Version: Thông tin mùa
  seasonalInfo: {
    season: {
      type: String,
      enum: ['peak', 'off-peak', 'shoulder'],
    }, // Mùa cao điểm, thấp điểm, trung bình
    peakMultiplier: {
      type: Number,
      default: 1.0,
    }, // Hệ số nhân giá (VD: 1.2 = tăng 20%)
  },
  
  // Promotion Version: Thông tin khuyến mãi
  promotionInfo: {
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    }, // % giảm giá
    discountAmount: {
      type: Number,
      min: 0,
      default: 0,
    }, // Số tiền giảm (VNĐ)
    bonusServices: [{
      type: String,
    }], // Dịch vụ bổ sung miễn phí
    promotionCode: {
      type: String,
      trim: true,
    }, // Mã khuyến mãi
    minBookingDays: {
      type: Number,
      min: 0,
    }, // Số ngày đặt trước tối thiểu
    maxParticipants: {
      type: Number,
      min: 1,
    }, // Số lượng khách tối đa cho khuyến mãi
  },
  
  // Special Version: Thông tin đặc biệt
  specialInfo: {
    eventType: {
      type: String,
      enum: ['vip', 'holiday', 'event', 'custom'],
    }, // Loại sự kiện
    eventName: String, // Tên sự kiện
    isVIP: {
      type: Boolean,
      default: false,
    }, // Tour VIP
    maxParticipants: {
      type: Number,
      min: 1,
      default: 10,
    }, // Giới hạn số người (VIP thường nhỏ)
    luxuryLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    }, // Mức độ sang trọng (1-5 sao)
    exclusiveServices: [{
      type: String,
    }], // Dịch vụ độc quyền
    requirements: String, // Yêu cầu đặc biệt
  },
  
  // Giá theo đối tượng
  pricing: {
    adult: {
      type: Number,
      required: true,
      min: 0,
    },
    child: {
      type: Number,
      default: 0,
      min: 0,
    },
    infant: {
      type: Number,
      default: 0,
      min: 0,
    },
    senior: {
      type: Number,
      default: 0,
      min: 0,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    }, // Giá cơ bản
  },
  
  // Lịch khởi hành (nếu khác với tour gốc)
  schedules: [{
    departureDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
      required: true,
    },
    availableSlots: {
      type: Number,
      required: true,
      min: 0,
    }, // Số chỗ còn trống
    status: {
      type: String,
      enum: ['available', 'full', 'closed'],
      default: 'available',
    },
  }],
  
  // Lịch trình riêng (nếu khác tour gốc)
  customItinerary: [{
    day: Number,
    date: Date,
    time: String,
    title: String,
    description: String,
    location: String,
    attractions: [{
      name: String,
      description: String,
      visitDuration: String,
    }],
    activities: [{
      time: String,
      activity: String,
      description: String,
    }],
  }],
  
  // Dịch vụ bổ sung
  additionalServices: [{
    name: String,
    description: String,
    price: Number,
    included: {
      type: Boolean,
      default: false,
    }, // Có bao gồm trong giá không
  }],
  
  // Dịch vụ đã bao gồm (override tour gốc)
  includedServices: [{
    type: String,
  }],
  
  // Dịch vụ không bao gồm (override tour gốc)
  excludedServices: [{
    type: String,
  }],
  
  // Trạng thái
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'expired'],
    default: 'draft',
  },
  
  // Ưu tiên hiển thị (Special > Promotion > Seasonal)
  displayPriority: {
    type: Number,
    default: 0,
  },
  
  // Số lượng đã đặt
  bookedCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  
  // Ghi chú
  notes: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
tourVersionSchema.index({ tour: 1, versionType: 1 });
tourVersionSchema.index({ startDate: 1, endDate: 1 });
tourVersionSchema.index({ status: 1, displayPriority: -1 });

// Auto tính displayPriority dựa trên versionType
tourVersionSchema.pre('save', function(next) {
  const priorityMap = {
    special: 3,
    promotion: 2,
    seasonal: 1,
  };
  this.displayPriority = priorityMap[this.versionType] || 0;
  
  // Auto update status
  const now = new Date();
  if (this.endDate < now) {
    this.status = 'expired';
  } else if (this.startDate <= now && this.endDate >= now && this.status === 'draft') {
    this.status = 'active';
  }
  
  next();
});

// Validation: Kiểm tra overlap dates
tourVersionSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('startDate') || this.isModified('endDate')) {
    const TourVersion = mongoose.model('TourVersion');
    const existingVersions = await TourVersion.find({
      _id: { $ne: this._id },
      tour: this.tour,
      status: { $in: ['active', 'draft'] },
      $or: [
        {
          startDate: { $lte: this.endDate },
          endDate: { $gte: this.startDate },
        },
      ],
    });
    
    if (existingVersions.length > 0) {
      // Cho phép overlap nếu khác loại version
      const sameType = existingVersions.filter(v => v.versionType === this.versionType);
      if (sameType.length > 0) {
        return next(new Error('Đã có version cùng loại trong khoảng thời gian này'));
      }
    }
  }
  next();
});

module.exports = mongoose.model('TourVersion', tourVersionSchema);

