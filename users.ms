# Aeloria Ledger Demo Credentials

This project is configured to use an in-memory database by default. The following accounts are automatically seeded into the system when you start the backend server.

### 👑 Admin Account
- **Email:** `admin@aeloria.com`
- **Password:** `password123`
*(Admins have special privileges and access to all sections of the application.)*

### 🏢 Dummy Clients
Four dummy clients are also pre-populated for testing:
- **Client 1:** Acme Corp (`contact@acme.com`)
- **Client 2:** Globex Inc (`hello@globex.com`)
- **Client 3:** Stark Industries (`tony@stark.com`)
- **Client 4:** Wayne Enterprises (`bruce@wayne.com`)

### 📁 Dummy Data
Along with these accounts, there are dummy Projects and Invoices seeded to ensure the dashboard and UI pages display realistic data immediately after starting up.

> **Note:** Since this runs entirely in-memory (`mongodb-memory-server`), any changes you make will be reset the next time you restart the backend server.
