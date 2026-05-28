# 🚀 Telegram SaaS CRM (Backend MVP)

## 🛠 Tech Stack

### 🖥️ Backend & API
![Python](https://img.shields.io/badge/Python-brightgreen?style=flat&logo=python)
![Django](https://img.shields.io/badge/Django-brightgreen?style=flat&logo=django)
![Django Ninja](https://img.shields.io/badge/Django_ninja-brightgreen?style=flat&logo=django)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-brightgreen?style=flat&logo=postgresql&logoColor=blue)

### 🌐 Frontend (Modern UI)
![React](https://img.shields.io/badge/React-darkblue?style=flat&logo=react&logoColor=blue)
![TypeScript](https://img.shields.io/badge/TypeScript-darkblue?style=flat&logo=TypeScript&logoColor=blue)
![Next.js](https://img.shields.io/badge/Next.js-darkblue?style=flat&logo=Next.js&logoColor=blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-darkblue?style=flat&logo=TailwindCSS&logoColor=blue)

### 🤖 Telegram Integration
![Aiogram](https://img.shields.io/badge/Aiogram-blue?style=flat&logo=Telegram&logoColor=lightblue)

### 📦 Infrastructure
![Docker](https://img.shields.io/badge/Docker-blue?style=flat&logo=Docker&logoColor=lightblue)
![Git](https://img.shields.io/badge/Git-blue?style=flat&logo=Git&logoColor=lightblue)


## 🏗 Ключевые архитектурные решения
* **Telegram-Native Auth:** Регистрация и идентификация пользователей по `tg_id`.
* **SaaS Logic:** Реализована сущность "Владелец" (Owner), позволяющая мерчантам управлять своими брендами и точками продаж.
* **Security First:** Удаление и редактирование товаров защищено многоуровневой фильтрацией (`shop -> owner -> user`). Пользователь может управлять только своим контентом.

## 🚀 Основные эндпоинты (MVP)
* `POST /register` — Регистрация мерчанта (ИНН, бренд, телефон).
* `POST /shop` — Создание новой торговой точки.
* `POST /product` — Наполнение каталога.
* `DELETE /product/{id}` — Безопасное удаление с проверкой прав доступа.
* `GET /products` — Общий список товаров с поддержкой пагинации.

## 📊 Схема данных
Проект построен на четкой иерархии сущностей:
- **User**: Системный аккаунт (связка с Telegram ID)
- **Owner**: Профиль мерчанта с бизнес-данными (ИНН, реквизиты).
- **Shop**: Торговая точка, принадлежащая владельцу (связь One-to-Many).
- **Product**: Товарная единица внутри конкретного магазина.

## 🔥 Особенности реализации
- **Type Safety**: Полная типизация запросов и ответов через Pydantic-схемы в Django Ninja.
- **Fast Pagination**: Оптимизированный вывод списков товаров для работы под нагрузкой.
- **Decimal Precision**: Использование Decimal для цен, что исключает ошибки округления при финансовых расчетах.

## 🏗 Архитектура базы данных (Backend MVP)

Проект спроектирован с учетом масштабируемости (SaaS-модель) и строгой целостности данных. Ниже представлена визуализация связей между сущностями:

![Database Schema](./docs/db-schema.png)

### Ключевые узлы архитектуры:
*   **Иерархия доступа**: `TelegramUser` ➔ `OwnerProfile` ➔ `Shop` ➔ `Product`. Такая цепочка позволяет реализовать безопасное управление контентом на уровне SQL-запросов.
*   **Финансовая стабильность**: В модели `OrderItem` реализована денормализация данных (сохранение цены и названия товара на момент покупки), что гарантирует неизменность истории заказов при изменении каталога.
*   **Логирование**: Сущность `OrderHistory` обеспечивает полный аудит изменений статусов заказов.
*   **Масштабируемость**: Связь `Tariff` ➔ `OwnerProfile` позволяет гибко управлять лимитами магазинов и товаров для разных уровней подписки мерчантов.

## 📽 "Дневник разработчика"
*https://www.youtube.com/@saas_telega*

## 🛠 Установка и запуск

### 🐍 Backend (Django + Ninja)
1. **Клонировать репозиторий:** `git clone https://github.com/MAPATC/SlyCart-Saas-project.git`
2. **Создать и активировать виртуальное окружение:**
   - `python -m venv venv`
   - `source venv/bin/activate` (или `venv\Scripts\activate` для Windows)
3. **Установить зависимости:** `pip install -r requirements.txt`
4. **Настроить окружение:** Создать файл `.env` на основе `.env.example`
5. **Применить миграции:** `python manage.py migrate`
6. **Запустить сервер:** `python manage.py runserver`

### ⚛️ Frontend (React + Next.js)
1. **Перейти в папку:** `cd saas-nextjs-frontend`
2. **Установить зависимости:** `npm install`
3. **Запустить в режиме разработки:** `npm run dev`
