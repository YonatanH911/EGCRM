# EGCRM — Enterprise CRM System

A modern, full-stack CRM (Customer Relationship Management) application built with **FastAPI** (Python) and **Next.js** (TypeScript), featuring a dark glassmorphism-inspired UI design.

---

## ✨ Features

- 🔐 **Authentication** — JWT-based login & registration
- 🏢 **Accounts** — Manage organizational records with address details
- 👤 **Contacts** — Full contact profiles linked to accounts
- 🎯 **Leads** — Kanban-style pipeline (New → Qualified → Proposal → Won/Lost)
- 📄 **Contracts** — Track formal agreements with billing, dates & contacts
- 🔒 **Vaults** — Secure vault management (Open / Locked / Maintenance)
- 📦 **Deposits** — Track software/hardware deposits in vaults
- 📅 **Activities** — Log tasks, emails, appointments & phone calls
- 🌑 **Dark professional UI** — Indigo/blue gradient design system

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python 3.11+) |
| Database | MySQL |
| Auth | JWT (OAuth2 Password Flow) |
| Icons | Lucide React |

---

## 📋 Prerequisites

Make sure you have the following installed:

- [**Node.js 18+**](https://nodejs.org/) and npm
- [**Python 3.11+**](https://www.python.org/downloads/)
- [**MySQL 8+**](https://dev.mysql.com/downloads/mysql/) (running locally or remote)
- [**Git**](https://git-scm.com/)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YonatanH911/EGCRM.git
cd EGCRM
```

---

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

**Create a virtual environment and activate it:**

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python -m venv venv
source venv/bin/activate
```

**Install Python dependencies:**

```bash
pip install -r requirements.txt
```

**Configure the database connection:**

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=mysql+pymysql://YOUR_USER:YOUR_PASSWORD@localhost:3306/egcrm
SECRET_KEY=your-super-secret-jwt-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

> ⚠️ Replace `YOUR_USER`, `YOUR_PASSWORD` with your MySQL credentials.  
> Create the `egcrm` database in MySQL first:

```sql
CREATE DATABASE egcrm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Start the backend server:**

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

### 3. Frontend Setup

Open a new terminal and navigate to the frontend:

```bash
cd frontend
```

**Install Node.js dependencies:**

```bash
npm install
```

**Configure the API URL:**

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Start the development server:**

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

### 4. Create your first user

Once both servers are running, go to `http://localhost:3000/register` to create an account, then sign in at `/login`.

---

## 📁 Project Structure

```
EGCRM/
├── backend/
│   ├── main.py          # FastAPI routes
│   ├── models.py        # SQLAlchemy database models
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── crud.py          # Database operations
│   ├── auth.py          # JWT authentication
│   ├── database.py      # DB connection setup
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/           # Login page
│   │   │   ├── register/        # Register page
│   │   │   └── dashboard/       # All CRM pages
│   │   │       ├── accounts/
│   │   │       ├── contacts/
│   │   │       ├── leads/
│   │   │       ├── contracts/
│   │   │       ├── vaults/
│   │   │       ├── deposits/
│   │   │       └── activities/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   └── lib/
│   │       └── api.ts           # Axios API client
│   └── package.json
│
└── README.md
```

---

## 🖥 Quick Start (Windows)

A convenience script is included. Run from the project root:

```bat
start_servers.bat
```
## 🐧 Quick Start (Linux)

A convenience script is included. Run from the project root:

```sh
start_servers.sh
```

This opens both the backend and frontend in separate terminal windows.

---

## 🔒 Security Notes

- Never commit your `.env` or `.env.local` files (they are in `.gitignore`)
- Change the `SECRET_KEY` in production to a long random string
- The default token expiry is 24 hours

---

## 📦 Backend Dependencies

Key packages (see `requirements.txt` for full list):

```
fastapi
uvicorn
sqlalchemy
pymysql
python-jose[cryptography]
passlib[bcrypt]
python-multipart
python-dotenv
```

Install all at once:

```bash
pip install -r requirements.txt
```
