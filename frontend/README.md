# Aeloria Ledger - Frontend UI

Welcome to the frontend application for **Aeloria Ledger**! This is a modern, responsive, and beautifully designed user interface built with React and Vite. It provides an intuitive dashboard for managing enterprise financial operations, including clients, invoices, quotations, and team settings.

## 🚀 Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Routing:** React Router DOM
- **Animations:** Framer Motion
- **Styling:** Vanilla CSS (Custom Design System with Glassmorphism)
- **HTTP Client:** Axios
- **Icons:** Google Material Symbols

## 📦 Installation & Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   Make sure you have Node.js installed, then run:
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will usually be available at `http://localhost:5174/` (or the port specified in your console).

## 🎨 Design System

The frontend employs a completely custom CSS architecture (`index.css`) built from the ground up without heavy CSS frameworks like Tailwind or Bootstrap. It utilizes:
- **CSS Variables:** For strict color theming and spacing.
- **Glassmorphism:** To create a modern, frosted-glass effect across cards and panels.
- **Framer Motion:** For organic, smooth micro-interactions and background mesh animations.

## 🔌 API Integration

The frontend expects the backend server to be running on `http://localhost:5000` by default. API calls are managed via an Axios instance located in `src/services/api.js`, which automatically handles JWT token injection for authenticated routes.
