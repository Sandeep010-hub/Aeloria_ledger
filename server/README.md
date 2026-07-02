# Aeloria Ledger - Backend API

Welcome to the backend service for **Aeloria Ledger**! This Node.js/Express application powers the data operations, authentication, and PDF generation for the Aeloria workspace.

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via `mongodb-memory-server` for instant testing)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs
- **PDF Generation:** PDFKit
- **File Uploads:** Multer (Memory Storage)

## 📦 Installation & Setup

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   The API will run on `http://localhost:5000/`.

## 🗄️ In-Memory Database & Seed Data

To make testing and deployment as seamless as possible, this backend uses `mongodb-memory-server`. 
- **No external database connection string is required!** 
- Every time you start the server, it initializes a fresh MongoDB instance entirely in RAM.
- A built-in seed script automatically populates the database with a default Admin user, mock clients, projects, and invoices.

*Note: Because the database lives in memory, any data you add or modify while testing will be lost when the server is restarted.*

## 📄 PDF Generation Service

The backend features a built-in PDF generation engine (`services/pdfService.js`) using PDFKit. It dynamically generates beautifully formatted corporate PDF invoices and quotations and streams them directly to the frontend as binary blobs, avoiding unnecessary disk storage.
