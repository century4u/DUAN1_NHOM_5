const Tour = require('../models/Tour');

// Lấy tất cả tours
const getAllTours = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } },
      ];
    }

    const tours = await Tour.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: tours,
      count: tours.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tour',
      error: error.message,
    });
  }
};

// Lấy tour theo ID
const getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tour',
      });
    }

    res.json({
      success: true,
      data: tour,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin tour',
      error: error.message,
    });
  }
};

// Tạo tour mới
const createTour = async (req, res) => {
  try {
    const categoryMapping = {
      domestic: 'Tour trong nước',
      international: 'Tour quốc tế',
      custom: 'Tour theo yêu cầu',
    };

    const tourData = {
      ...req.body,
      categoryLabel: categoryMapping[req.body.category],
      isCustom: req.body.category === 'custom',
    };

    const tour = new Tour(tourData);
    await tour.save();

    res.status(201).json({
      success: true,
      message: 'Tạo tour thành công',
      data: tour,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi tạo tour',
      error: error.message,
    });
  }
};

// Cập nhật tour
const updateTour = async (req, res) => {
  try {
    const categoryMapping = {
      domestic: 'Tour trong nước',
      international: 'Tour quốc tế',
      custom: 'Tour theo yêu cầu',
    };

    const updateData = {
      ...req.body,
    };

    if (req.body.category) {
      updateData.categoryLabel = categoryMapping[req.body.category];
      updateData.isCustom = req.body.category === 'custom';
    }

    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tour',
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật tour thành công',
      data: tour,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi cập nhật tour',
      error: error.message,
    });
  }
};

// Xóa tour
const deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tour',
      });
    }

    res.json({
      success: true,
      message: 'Xóa tour thành công',
      data: tour,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa tour',
      error: error.message,
    });
  }
};

// Lấy tours theo category
const getToursByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const tours = await Tour.find({ 
      category,
      status: 'active',
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tours,
      count: tours.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tour theo loại',
      error: error.message,
    });
  }
};

module.exports = {
  getAllTours,
  getTourById,
  createTour,
  updateTour,
  deleteTour,
  getToursByCategory,
};

