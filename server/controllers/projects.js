import Project from '../models/Project.js';
import Client from '../models/Client.js';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    let query = {};

    // Filter by status if specified
    if (status) {
      query.status = status;
    }

    // Filter by search term if specified (searches Name, Description, and Client Name/Company)
    if (search) {
      const matchedClients = await Client.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      const clientIds = matchedClients.map((c) => c._id);

      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { clientId: { $in: clientIds } },
      ];
    }

    const projects = await Project.find(query)
      .populate('clientId')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('clientId');
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin, CIO, Accountant)
export const createProject = async (req, res, next) => {
  try {
    const { name, description, clientId, budget, startDate, endDate, status } = req.body;

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      res.status(404);
      throw new Error('Associated client not found');
    }

    const project = await Project.create({
      name,
      description,
      clientId,
      budget: budget || 0,
      startDate: startDate || Date.now(),
      endDate: endDate || null,
      status: status || 'In Progress',
    });

    const populatedProject = await Project.findById(project._id).populate('clientId');

    res.status(201).json({ success: true, data: populatedProject });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin, CIO, Accountant)
export const updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // If client is being changed, verify the new client exists
    if (req.body.clientId && req.body.clientId.toString() !== project.clientId.toString()) {
      const client = await Client.findById(req.body.clientId);
      if (!client) {
        res.status(404);
        throw new Error('New associated client not found');
      }
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('clientId');

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin, CIO)
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Project removed' });
  } catch (error) {
    next(error);
  }
};
