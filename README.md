<div align="center">
  <img src="https://via.placeholder.com/150/004f54/ffffff?text=Aeloria" alt="Aeloria Logo" width="100"/>
  <h1>Aeloria Ledger</h1>
  <p><strong>The Enterprise Finance OS for Modern Operations</strong></p>
</div>

Aeloria Ledger is a full-stack web application designed for progressive startups to consolidate operational statistics, manage client billings, create dynamic quotes, and stream beautifully formatted financial PDFs. It features a stunning, premium UI (glassmorphism, fluid animations) backed by a robust Express/MongoDB API.

## 🌟 Key Features

- **Pixel-Perfect Dashboard:** A stunning, modern UI built with vanilla CSS, Framer Motion, and a highly responsive sidebar.
- **Client & Project Management:** Easily track active clients and related enterprise projects.
- **Dynamic Invoicing & Quotes:** Generate highly detailed invoices with localized GST/tax levels and discount rates.
- **Real-Time PDF Streaming:** Instantly download perfectly formatted corporate PDFs generated on-the-fly by the backend.
- **Zero-Config Database:** Runs entirely in-memory using `mongodb-memory-server` so you can clone and test instantly without installing or configuring external databases!

## 🚀 Quick Start Guide

This project is a monorepo consisting of a `frontend` and a `server`. You will need two terminal windows to run both simultaneously.

### 1. Start the Backend Server

The backend requires zero database configuration. It will automatically spin up an in-memory database and seed it with dummy data.

```bash
cd server
npm install
npm start
```
*The API will be available at `http://localhost:5000`*

### 2. Start the Frontend UI

Open a new terminal window and run:

```bash
cd frontend
npm install
npm run dev
```
*The web application will be available at `http://localhost:5174` (or as specified by Vite)*

## 🔐 Demo Credentials

When the backend server starts, it automatically seeds an administrator account so you can log in immediately:

- **Email:** `admin@aeloria.com`
- **Password:** `password123`

*(For more details on the seeded data, please refer to the `users.ms` file in the root directory).*

## 📁 Repository Structure

- `/frontend` - React 18 + Vite application containing all UI components, pages, and the custom CSS design system.
- `/server` - Node.js + Express backend containing the API routes, JWT authentication logic, and PDFKit generation service.
- `users.ms` - Documentation containing the default seeded credentials.

## 🛠️ Technology Stack

**Frontend:** React, Vite, React Router, Framer Motion, Axios  
**Backend:** Node.js, Express, MongoDB (Memory Server), Mongoose, PDFKit, JWT

---
*© Aeloria Corp. All rights reserved.*
