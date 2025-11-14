const TourVersion = require('../models/TourVersion');
const Tour = require('../models/Tour');

// Lấy tất cả versions
const getAllVersions = async (req, res) => {
  try {
    const { tourId, versionType, status } = req.query;
    const query = {};

    if (tourId) {
      query.tour = tourId;
    }

    if (versionType) {
      query.versionType = versionType;
    }

    if (status) {
      query.status = status;
    }

    const versions = await TourVersion.find(query)
      .populate('tour', 'name category destination')
      .sort({ displayPriority: -1, createdAt: -1 });

    res.json({
      success: true,
      data: versions,
      count: versions.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách version',
      error: error.message,
    });
  }
};

// Lấy version theo ID
const getVersionById = async (req, res) => {
  try {
    const version = await TourVersion.findById(req.params.id)
      .populate('tour');

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy version',
      });
    }

    res.json({
      success: true,
      data: version,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin version',
      error: error.message,
    });
  }
};

// Lấy versions theo tour
const getVersionsByTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const versions = await TourVersion.find({
      tour: tourId,
      status: { $in: ['active', 'draft'] },
    })
      .populate('tour', 'name category destination')
      .sort({ displayPriority: -1, startDate: 1 });

    res.json({
      success: true,
      data: versions,
      count: versions.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy versions của tour',
      error: error.message,
    });
  }
};

// Tạo version mới
const createVersion = async (req, res) => {
  try {
    // Kiểm tra tour gốc tồn tại
    const tour = await Tour.findById(req.body.tour);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour gốc không tồn tại',
      });
    }

    // Tính giá nếu là seasonal với multiplier
    if (req.body.versionType === 'seasonal' && req.body.seasonalInfo?.peakMultiplier) {
      const multiplier = req.body.seasonalInfo.peakMultiplier;
      req.body.pricing = {
        ...req.body.pricing,
        adult: Math.round(tour.price * multiplier),
        basePrice: Math.round(tour.price * multiplier),
      };
    }

    // Tính giá nếu là promotion với discount
    if (req.body.versionType === 'promotion' && req.body.promotionInfo) {
      const { discountPercentage, discountAmount } = req.body.promotionInfo;
      const basePrice = req.body.pricing?.basePrice || tour.price;
      
      let finalPrice = basePrice;
      if (discountPercentage > 0) {
        finalPrice = Math.round(basePrice * (1 - discountPercentage / 100));
      } else if (discountAmount > 0) {
        finalPrice = Math.max(0, basePrice - discountAmount);
      }
      
      req.body.pricing = {
        ...req.body.pricing,
        adult: finalPrice,
        basePrice: finalPrice,
      };
    }

    const version = new TourVersion(req.body);
    await version.save();

    res.status(201).json({
      success: true,
      message: 'Tạo version thành công',
      data: version,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi tạo version',
      error: error.message,
    });
  }
};

// Cập nhật version
const updateVersion = async (req, res) => {
  try {
    const version = await TourVersion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy version',
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật version thành công',
      data: version,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi cập nhật version',
      error: error.message,
    });
  }
};

// Xóa version
const deleteVersion = async (req, res) => {
  try {
    const version = await TourVersion.findByIdAndDelete(req.params.id);

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy version',
      });
    }

    res.json({
      success: true,
      message: 'Xóa version thành công',
      data: version,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa version',
      error: error.message,
    });
  }
};

// Tính giá version dựa trên tour gốc
const calculatePrice = async (req, res) => {
  try {
    const { tourId, versionType, seasonalInfo, promotionInfo } = req.body;
    
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour gốc không tồn tại',
      });
    }

    let calculatedPrice = tour.price;

    if (versionType === 'seasonal' && seasonalInfo?.peakMultiplier) {
      calculatedPrice = Math.round(tour.price * seasonalInfo.peakMultiplier);
    } else if (versionType === 'promotion' && promotionInfo) {
      const { discountPercentage, discountAmount } = promotionInfo;
      if (discountPercentage > 0) {
        calculatedPrice = Math.round(tour.price * (1 - discountPercentage / 100));
      } else if (discountAmount > 0) {
        calculatedPrice = Math.max(0, tour.price - discountAmount);
      }
    }

    res.json({
      success: true,
      data: {
        originalPrice: tour.price,
        calculatedPrice,
        discount: tour.price - calculatedPrice,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tính giá',
      error: error.message,
    });
  }
};

module.exports = {
  getAllVersions,
  getVersionById,
  getVersionsByTour,
  createVersion,
  updateVersion,
  deleteVersion,
  calculatePrice,
};

