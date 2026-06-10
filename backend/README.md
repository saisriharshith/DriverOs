# DriverOS Backend

Digital Operating System for Drivers.

## Tech Stack
- Django 5
- Django REST Framework
- PostgreSQL (Neon)
- JWT Authentication

## Setup Instructions

1. **Clone the repository**
2. **Navigate to backend directory**
   ```bash
   cd backend
   ```
3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```
4. **Create .env file**
   Copy `.env.example` to `.env` and fill in the details.
5. **Run migrations**
   ```bash
   python manage.py migrate
   ```
6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```
7. **Run server**
   ```bash
   python manage.py runserver
   ```

## API Endpoints

- **Auth**
  - `POST /api/v1/auth/send-otp/`: Send OTP to phone
  - `POST /api/v1/auth/verify/`: Verify OTP and get JWT tokens
  - `GET /api/v1/auth/profile/`: Get current user profile
- **Modules** (All require JWT Authentication)
  - `/api/v1/drivers/`: Driver profile management
  - `/api/v1/vehicles/`: Vehicle management
  - `/api/v1/documents/`: Document vault
  - `/api/v1/expenses/`: Expense tracking
  - `/api/v1/notifications/`: Alerts and messages
  - `/api/v1/trips/`: Trip management
  - `/api/v1/compliance/`: Compliance scoring

## API Documentation
- Swagger: `/api/schema/swagger-ui/`
- Redoc: `/api/schema/redoc/`

## Deployment
This project is ready to be deployed on Render, Railway, or any platform supporting Django.
Use `gunicorn config.wsgi` as the start command.
Ensure `DATABASE_URL` is set to your Neon PostgreSQL instance.
