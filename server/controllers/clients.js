import Client from '../models/Client.js';

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
export const getClients = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    let query = {};

    // Filter by status if specified
    if (status) {
      query.status = status;
    }

    // Filter by search term if specified (searches Name, Company, Email)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const clients = await Client.find(query).sort({ name: 1 });
    res.json({ success: true, count: clients.length, data: clients });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
export const getClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }
    res.json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new client
// @route   POST /api/clients
// @access  Private (Admin, CIO, Accountant)
export const createClient = async (req, res, next) => {
  try {
    const { name, email, phone, companyName, address, gstNumber, status } = req.body;

    const client = await Client.create({
      name,
      email,
      phone,
      companyName,
      address,
      gstNumber,
      status: status || 'Active',
    });

    res.status(201).json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private (Admin, CIO, Accountant)
export const updateClient = async (req, res, next) => {
  try {
    let client = await Client.findById(req.params.id);
    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }

    client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private (Admin, CIO)
export const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }

    await Client.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Client removed' });
  } catch (error) {
    next(error);
  }
};
