const Quote = require('../models/Quote');
const Tour = require('../models/Tour');
const TourVersion = require('../models/TourVersion');

// Lấy tất cả quotes
const getAllQuotes = async (req, res) => {
  try {
    const { tourId, status, search } = req.query;
    const query = {};

    if (tourId) {
      query.tour = tourId;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { quoteNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'customer.company': { $regex: search, $options: 'i' } },
      ];
    }

    const quotes = await Quote.find(query)
      .populate('tour', 'name destination category')
      .populate('tourVersion', 'name versionType')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: quotes,
      count: quotes.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách báo giá',
      error: error.message,
    });
  }
};

// Lấy quote theo ID
const getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('tour')
      .populate('tourVersion');

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy báo giá',
      });
    }

    // Update view count
    quote.sentInfo.viewCount += 1;
    quote.sentInfo.lastViewedAt = new Date();
    await quote.save();

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin báo giá',
      error: error.message,
    });
  }
};

// Tạo quote mới
const createQuote = async (req, res) => {
  try {
    const { tourId, tourVersionId, customer, groupInfo, selectedServices } = req.body;

    // Lấy thông tin tour
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour không tồn tại',
      });
    }

    // Lấy thông tin tour version (nếu có)
    let tourVersion = null;
    if (tourVersionId) {
      tourVersion = await TourVersion.findById(tourVersionId);
    }

    // Tính giá
    const pricing = calculatePricing(tour, tourVersion, groupInfo, selectedServices);

    const quoteData = {
      tour: tourId,
      tourVersion: tourVersionId || null,
      customer,
      groupInfo,
      selectedServices: selectedServices || [],
      pricing,
    };

    const quote = new Quote(quoteData);
    await quote.save();

    const savedQuote = await Quote.findById(quote._id)
      .populate('tour', 'name destination')
      .populate('tourVersion', 'name');

    res.status(201).json({
      success: true,
      message: 'Tạo báo giá thành công',
      data: savedQuote,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi tạo báo giá',
      error: error.message,
    });
  }
};

// Tính toán giá
const calculatePricing = (tour, tourVersion, groupInfo, selectedServices = []) => {
  // Sử dụng giá từ version nếu có, không thì dùng tour gốc
  const basePricing = tourVersion?.pricing || tour.pricing || {
    adult: tour.price || 0,
    child: 0,
    infant: 0,
    senior: 0,
  };

  // Tính giá theo đối tượng
  const adultsPrice = (basePricing.adult || basePricing.adult || 0) * (groupInfo.adults || 0);
  const childrenPrice = (basePricing.child || 0) * (groupInfo.children || 0);
  const infantsPrice = (basePricing.infant || 0) * (groupInfo.infants || 0);
  const seniorsPrice = (basePricing.senior || 0) * (groupInfo.seniors || 0);

  // Tổng giá tour
  const tourSubtotal = adultsPrice + childrenPrice + infantsPrice + seniorsPrice;

  // Tính giá dịch vụ bổ sung
  let servicesSubtotal = 0;
  const services = selectedServices.map(service => {
    const totalPrice = (service.unitPrice || 0) * (service.quantity || 1);
    servicesSubtotal += totalPrice;
    return {
      ...service,
      totalPrice,
    };
  });

  // Tổng trước giảm giá
  const totalBeforeDiscount = tourSubtotal + servicesSubtotal;

  // Giảm giá (mặc định 0)
  const discount = {
    amount: 0,
    percentage: 0,
    reason: '',
  };

  // Tổng sau giảm giá
  const total = totalBeforeDiscount - discount.amount;

  // VAT (mặc định 10%)
  const vatPercentage = 10;
  const vatAmount = Math.round(total * (vatPercentage / 100));

  // Tổng cuối cùng
  const finalTotal = total + vatAmount;

  return {
    basePrice: basePricing.basePrice || basePricing.adult || tour.price || 0,
    adultsPrice: basePricing.adult || basePricing.adult || 0,
    childrenPrice: basePricing.child || 0,
    infantsPrice: basePricing.infant || 0,
    seniorsPrice: basePricing.senior || 0,
    tourSubtotal,
    servicesSubtotal,
    discount,
    total,
    vat: {
      percentage: vatPercentage,
      amount: vatAmount,
    },
    finalTotal,
  };
};

// Cập nhật quote
const updateQuote = async (req, res) => {
  try {
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('tour', 'name destination')
      .populate('tourVersion', 'name');

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy báo giá',
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật báo giá thành công',
      data: quote,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi cập nhật báo giá',
      error: error.message,
    });
  }
};

// Xóa quote
const deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy báo giá',
      });
    }

    res.json({
      success: true,
      message: 'Xóa báo giá thành công',
      data: quote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa báo giá',
      error: error.message,
    });
  }
};

// Tính giá nhanh (không lưu)
const quickCalculate = async (req, res) => {
  try {
    const { tourId, tourVersionId, groupInfo, selectedServices } = req.body;

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour không tồn tại',
      });
    }

    let tourVersion = null;
    if (tourVersionId) {
      tourVersion = await TourVersion.findById(tourVersionId);
    }

    // Sử dụng giá từ version nếu có, không thì dùng tour gốc
    const basePricing = tourVersion?.pricing || tour.pricing || {
      adult: tour.price || 0,
      child: 0,
      infant: 0,
      senior: 0,
    };

    // Tính giá theo đối tượng
    const adultsPrice = (basePricing.adult || basePricing.adult || 0) * (groupInfo.adults || 0);
    const childrenPrice = (basePricing.child || 0) * (groupInfo.children || 0);
    const infantsPrice = (basePricing.infant || 0) * (groupInfo.infants || 0);
    const seniorsPrice = (basePricing.senior || 0) * (groupInfo.seniors || 0);

    // Tổng giá tour
    const tourSubtotal = adultsPrice + childrenPrice + infantsPrice + seniorsPrice;

    // Tính giá dịch vụ bổ sung
    let servicesSubtotal = 0;
    if (selectedServices && selectedServices.length > 0) {
      servicesSubtotal = selectedServices.reduce((sum, service) => {
        return sum + ((service.unitPrice || 0) * (service.quantity || 1));
      }, 0);
    }

    // Tổng trước giảm giá
    const totalBeforeDiscount = tourSubtotal + servicesSubtotal;

    // Giảm giá (mặc định 0)
    const discount = {
      amount: 0,
      percentage: 0,
      reason: '',
    };

    // Tổng sau giảm giá
    const total = totalBeforeDiscount - discount.amount;

    // VAT (mặc định 10%)
    const vatPercentage = 10;
    const vatAmount = Math.round(total * (vatPercentage / 100));

    // Tổng cuối cùng
    const finalTotal = total + vatAmount;

    const pricing = {
      basePrice: basePricing.basePrice || basePricing.adult || tour.price || 0,
      adultsPrice: basePricing.adult || basePricing.adult || 0,
      childrenPrice: basePricing.child || 0,
      infantsPrice: basePricing.infant || 0,
      seniorsPrice: basePricing.senior || 0,
      tourSubtotal,
      servicesSubtotal,
      discount,
      total,
      vat: {
        percentage: vatPercentage,
        amount: vatAmount,
      },
      finalTotal,
    };

    res.json({
      success: true,
      data: pricing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tính giá',
      error: error.message,
    });
  }
};

// Gửi quote qua email
const sendQuoteEmail = async (req, res) => {
  try {
    const { quoteId } = req.params;
    const quote = await Quote.findById(quoteId)
      .populate('tour', 'name destination')
      .populate('tourVersion', 'name');

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy báo giá',
      });
    }

    // TODO: Implement email sending
    // For now, just update sent status
    quote.sentInfo.emailSent = true;
    quote.sentInfo.sentAt = new Date();
    quote.sentInfo.sentVia = quote.sentInfo.sentVia === 'zalo' ? 'both' : 'email';
    quote.status = quote.status === 'draft' ? 'sent' : quote.status;
    await quote.save();

    res.json({
      success: true,
      message: 'Gửi email báo giá thành công',
      data: quote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi email',
      error: error.message,
    });
  }
};

// Gửi quote qua Zalo
const sendQuoteZalo = async (req, res) => {
  try {
    const { quoteId } = req.params;
    const quote = await Quote.findById(quoteId)
      .populate('tour', 'name destination')
      .populate('tourVersion', 'name');

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy báo giá',
      });
    }

    // TODO: Implement Zalo API
    // For now, just update sent status
    quote.sentInfo.zaloSent = true;
    quote.sentInfo.sentAt = new Date();
    quote.sentInfo.sentVia = quote.sentInfo.sentVia === 'email' ? 'both' : 'zalo';
    quote.status = quote.status === 'draft' ? 'sent' : quote.status;
    await quote.save();

    res.json({
      success: true,
      message: 'Gửi Zalo báo giá thành công',
      data: quote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi Zalo',
      error: error.message,
    });
  }
};

module.exports = {
  getAllQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  deleteQuote,
  quickCalculate,
  sendQuoteEmail,
  sendQuoteZalo,
};

