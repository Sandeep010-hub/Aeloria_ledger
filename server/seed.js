import mongoose from 'mongoose';
import User from './models/User.js';
import Client from './models/Client.js';
import Project from './models/Project.js';
import Invoice from './models/Invoice.js';

export const seedDatabase = async () => {
  try {
    // Clear existing data (if any)
    await User.deleteMany();
    await Client.deleteMany();
    await Project.deleteMany();
    await Invoice.deleteMany();

    // Create Admin User
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@aeloria.com',
      password: 'password123',
      role: 'Admin',
      companyDetails: {
        companyName: 'Aeloria Corp',
        address: '123 Tech Lane, Silicon Valley',
        phone: '+1 555-0198',
        gstNumber: 'GSTIN123456789',
        currency: 'USD'
      }
    });

    // Create Dummy Clients
    const client1 = await Client.create({
      name: 'Acme Corp',
      email: 'contact@acme.com',
      phone: '+1 555-1020',
      companyName: 'Acme Corporation',
      address: '456 Business Rd',
      status: 'Active'
    });

    const client2 = await Client.create({
      name: 'Globex Inc',
      email: 'hello@globex.com',
      phone: '+1 555-3040',
      companyName: 'Globex Incorporated',
      address: '789 Industry Blvd',
      status: 'Active'
    });

    const client3 = await Client.create({
      name: 'Stark Industries',
      email: 'tony@stark.com',
      phone: '+1 555-9999',
      companyName: 'Stark Industries',
      address: '10880 Malibu Point',
      status: 'Active'
    });

    const client4 = await Client.create({
      name: 'Wayne Enterprises',
      email: 'bruce@wayne.com',
      phone: '+1 555-0000',
      companyName: 'Wayne Enterprises',
      address: '1007 Mountain Drive, Gotham',
      status: 'Active'
    });

    // Create Dummy Projects
    const project1 = await Project.create({
      name: 'Website Redesign',
      description: 'Overhaul of main corporate website',
      clientId: client1._id,
      budget: 5000,
      status: 'In Progress'
    });

    const project2 = await Project.create({
      name: 'Mobile App Development',
      description: 'Create a cross-platform mobile app for iOS and Android',
      clientId: client2._id,
      budget: 15000,
      status: 'Planning'
    });

    const project3 = await Project.create({
      name: 'Cloud Migration',
      description: 'Migrate on-premise servers to AWS infrastructure',
      clientId: client3._id,
      budget: 35000,
      status: 'Completed'
    });

    // Create Dummy Invoices
    const invoice1 = await Invoice.create({
      invoiceNumber: 'INV-1001',
      clientId: client1._id,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      items: [
        { description: 'Web Design Phase 1', quantity: 1, rate: 2000, amount: 2000 },
        { description: 'Frontend Development', quantity: 1, rate: 1500, amount: 1500 }
      ],
      subtotal: 3500,
      gst: 10,
      total: 3850,
      status: 'Pending'
    });

    console.log('Dummy Data Seeded Successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};
