import User from '../models/User.js';

// @desc    Get all team members
// @route   GET /api/team
// @access  Private
export const getTeamMembers = async (req, res, next) => {
  try {
    // List all users in this workspace company
    const members = await User.find({}).select('-password').sort({ role: 1, name: 1 });
    res.json({ success: true, count: members.length, data: members });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a team member
// @route   POST /api/team
// @access  Private (Admin)
export const addTeamMember = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Default password if none provided
    const defaultPassword = password || 'AeloriaPass123!';

    // Create user
    const member = await User.create({
      name,
      email,
      password: defaultPassword,
      role: role || 'Viewer',
      companyDetails: req.user.companyDetails, // Inherit company profile settings
    });

    res.status(201).json({
      success: true,
      data: {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        createdAt: member.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update team member role
// @route   PUT /api/team/:id
// @access  Private (Admin)
export const updateTeamMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (req.params.id === req.user._id.toString()) {
      res.status(400);
      throw new Error('You cannot modify your own administrative role');
    }

    const member = await User.findById(req.params.id);
    if (!member) {
      res.status(404);
      throw new Error('Team member not found');
    }

    member.role = role || member.role;
    await member.save();

    res.json({
      success: true,
      data: {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove team member
// @route   DELETE /api/team/:id
// @access  Private (Admin)
export const deleteTeamMember = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      res.status(400);
      throw new Error('You cannot delete your own administrative account');
    }

    const member = await User.findById(req.params.id);
    if (!member) {
      res.status(404);
      throw new Error('Team member not found');
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Team member removed from workspace' });
  } catch (error) {
    next(error);
  }
};
