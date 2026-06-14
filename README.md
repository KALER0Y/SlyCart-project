# 🚀 SlyCart: Telegram SaaS CRM

SlyCart is a comprehensive SaaS solution designed for merchants to manage their brands and shops directly through Telegram. It features a robust Django-based backend, a modern Next.js frontend, and a dedicated Telegram bot for seamless interaction.

## 🌟 Key Features

*   **Telegram-Native Authentication:** Seamless registration and identification using Telegram IDs.
*   **Multi-Tenant SaaS Architecture:** Support for "Owners" who can manage multiple brands and points of sale (Shops).
*   **Secure Content Management:** Multi-level filtering (`shop -> owner -> user`) ensures users only manage their own content.
*   **Full-Featured Catalog:** Product management with support for images, categories, and stock tracking.
*   **Robust Order System:** Comprehensive order lifecycle management with status tracking and audit history.
*   **Tariff & Subscription Management:** Flexible tier-based limits for shops and products.
*   **Type-Safe API:** Powered by Django Ninja with full Pydantic schema validation.
*   **Decimal Precision for Finances:** Using the `Decimal` field instead of float for currency rates and prices, completely eliminating floating-point rounding errors during financial transactions.
*   **Optimized Pagination:** High-performance product listing queries to ensure fast catalog rendering under load inside Telegram Web Apps (TWA).

## 🛠 Tech Stack

### Backend & API
- ![Python](https://img.shields.io/badge/Python-3.10+-brightgreen?style=flat&logo=python)
- ![Django](https://img.shields.io/badge/Django-5.0+-brightgreen?style=flat&logo=django)
- ![Django Ninja](https://img.shields.io/badge/Django_Ninja-Fast_API_Alternative-brightgreen)
- ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=flat&logo=postgresql)

### Frontend
- ![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)
- ![React](https://img.shields.io/badge/React-18-blue?style=flat&logo=react)
- ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)
- ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-blue?style=flat&logo=tailwindcss)

### Telegram Integration
- ![Aiogram](https://img.shields.io/badge/Aiogram-3.x-blue?style=flat&logo=telegram)

### Infrastructure
- ![Docker](https://img.shields.io/badge/Docker-Enabled-blue?style=flat&logo=docker)

## 🏗 Project Structure

```
.
├── bot/                     # Aiogram-based Telegram bot
├── saas-backend/            # Django Ninja backend API
│   ├── config/              # Project settings and API routing
│   └── core/                # Core business logic and models
├── saas-nextjs-frontend/    # Next.js web dashboard
├── docs/                    # Documentation and assets
├── docker-compose.yml       # Infrastructure orchestration
└── requirements.txt         # Python dependencies
```

## 📊 Database Schema

The project follows a strict hierarchy to ensure data integrity and security:
- **TelegramUser**: Central identity linked to Telegram ID.
- **OwnerProfile**: Business profile for merchants (INN, brand details).
- **Shop**: Individual storefronts owned by a merchant.
- **Product**: Goods listed within a specific shop.
- **Order**: Customer transactions with detailed history tracking.

![Database Schema](./docs/db-schema.png)

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (if not using Docker)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/MAPATC/SlyCart-Saas-project.git
    cd SlyCart-Saas-project
    ```

2.  **Environment Setup:**
    Create a `.env` file in the root based on `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Fill in your `BOT_TOKEN` and `SECRET_KEY`.

3.  **Spin up the Database (Docker):**
    ```bash
    docker-compose up -d
    ```

### Backend Setup
1.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    ```
2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Run migrations:**
    ```bash
    cd saas-backend
    python manage.py migrate
    ```
4.  **Start the server:**
    ```bash
    python manage.py runserver
    ```

### Frontend Setup
1.  **Navigate to the frontend directory:**
    ```bash
    cd saas-nextjs-frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start the development server:**
    ```bash
    npm run dev
    ```

### Telegram Bot Setup
1.  **Navigate to the bot directory:**
    ```bash
    cd bot
    ```
2.  **Run the bot:**
    ```bash
    python main.py
    ```

## 🧪 Testing

Run backend tests using pytest:
```bash
pytest
```

## 📽 Developer Diary
Follow the project development on YouTube: [SlyCart Dev Diary](https://www.youtube.com/@saas_telega)
