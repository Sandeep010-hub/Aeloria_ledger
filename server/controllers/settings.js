import User from '../models/User.js';

// @desc    Get company & profile settings
// @route   GET /api/settings
// @access  Private
export const getSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('companyDetails name email avatar');
    if (!user) {
      res.status(404);
      throw new Error('User settings profile not found');
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update company & profile settings
// @route   PUT /api/settings
// @access  Private (Admin, CIO)
export const updateSettings = async (req, res, next) => {
  try {
    const { name, email, companyName, address, phone, gstNumber, currency, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User profile not found');
    }

    // Update personal details
    user.name = name || user.name;
    user.email = email || user.email;
    user.avatar = avatar !== undefined ? avatar : user.avatar;

    // Handle logo file upload if provided (via Multer)
    let logoUrl = user.companyDetails.logo;
    if (req.file) {
      logoUrl = req.file.path || req.file.secure_url || '';
    }

    // Update company details
    user.companyDetails = {
      companyName: companyName || user.companyDetails.companyName,
      logo: logoUrl,
      address: address !== undefined ? address : user.companyDetails.address,
      phone: phone !== undefined ? phone : user.companyDetails.phone,
      gstNumber: gstNumber !== undefined ? gstNumber : user.companyDetails.gstNumber,
      currency: currency || user.companyDetails.currency,
    };

    // Propagate company details update to other team members in the same ecosystem!
    // Since they share the company dashboard, we can update companyDetails for all users.
    await user.save();
    
    // Propagate company name, logo, address, phone, etc., to all accounts so the team shares settings!
    await User.updateMany(
      { _id: { $ne: user._id } },
      { $set: { companyDetails: user.companyDetails } }
    );

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        companyDetails: user.companyDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};
