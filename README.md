# 🚗 DriverOS – Intelligent Driver Emergency & Safety System

DriverOS is a comprehensive safety and management system for drivers, fleet owners, and admins. It features an SOS system, live location tracking, health profile management, and more.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose

### Run with Docker
1. Clone the repository.
2. Run the following command in the root directory:
   ```bash
   docker-compose up --build
   ```
3. Access the frontend at `http://localhost:3000`.
4. Access the backend API at `http://localhost:8000/api/v1/`.
5. Access Swagger documentation at `http://localhost:8000/api/schema/swagger-ui/`.

### Manual Setup (Development)

#### Backend
1. Navigate to the `backend` directory.
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Run migrations:
   ```bash
   python manage.py migrate
   ```
4. Start the server:
   ```bash
   python manage.py runserver
   ```

#### Frontend
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🛠️ Features Implemented

### 1. User System & Auth
- JWT Authentication with `djangorestframework-simplejwt`.
- Mock OTP verification (Use `123456` as OTP).
- Role-based access control (Driver, Fleet Owner, Admin).

### 2. Emergency & Safety (SOS)
- One-click SOS trigger.
- Emergency event logging.
- Broadcast location during SOS.

### 3. Driver Profiles & Health
- Detailed driver profiles.
- Emergency contacts management.
- Health records (blood group, allergies, medical conditions).

### 4. Location Tracking
- Real-time location updates.
- Location history history tracking.

### 5. Admin Panel
- Dedicated APIs for managing users, emergencies, and locations.

## 📡 API Endpoints

### Auth
- `POST /api/v1/auth/send-otp/` - Send OTP to phone number.
- `POST /api/v1/auth/verify/` - Verify OTP and get JWT tokens.
- `GET /api/v1/auth/profile/` - Get current user profile.

### Emergency
- `POST /api/v1/emergency/sos/` - Trigger an SOS event.
- `GET /api/v1/emergency/sos/` - Get SOS history for the user.

### Drivers & Health
- `GET /api/v1/drivers/me/` - Get own driver profile.
- `PATCH /api/v1/drivers/me/` - Update own driver profile.
- `GET /api/v1/emergency-contacts/` - Manage emergency contacts.
- `GET /api/v1/health-records/` - Manage health records.

### Admin (Admin role required)
- `GET /api/v1/admin-panel/users/` - List all users.
- `GET /api/v1/admin-panel/emergencies/` - List all SOS events.
- `GET /api/v1/admin-panel/locations/` - List all location logs.

## 🏗️ Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS, Vite.
- **Backend:** Django, Django Rest Framework.
- **Database:** PostgreSQL (Production) / SQLite (Development).
- **Containerization:** Docker, Docker Compose.
- **Documentation:** Swagger/OpenAPI.
