# Israeli Business Licensing & Inspection System (מערכת רישוי עסקים)

A comprehensive backend system for managing business licensing and on-site inspections for Israeli Regional Councils. This project is built to comply with **Business Licensing Law, 5728-1968** (חוק רישוי עסקים) and includes advanced features like PDF generation and AI-powered risk assessment.

## 🚀 Features

*   **Strict MVC Architecture**: Organized structure for scalability and maintainability.
*   **Authentication & Authorization**: Secure JWT-based auth with role management (Inspector, Manager, Admin).
*   **Israeli Legal Compliance**: Data models reflect real legal entities (Licensing Items, Business, Reports).
*   **PDF Generation**: Automated generation of Hebrew inspection reports using **Puppeteer** (supports RTL and Hebrew fonts).
*   **AI Integration**: **Google Gemini AI** integration to automatically analyze inspection findings and generate risk assessments.
*   **Inspection Catalog**: Pre-seeded database with 120+ common legal defects (ליקויים) for standardized reporting.
*   **Cloud Ready**: Dockerized application optimized for deployment on **Railway**.

## 🛠️ Tech Stack

*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: PostgreSQL (via Sequelize ORM)
*   **Authentication**: JSON Web Tokens (JWT) & Bcrypt
*   **PDF Engine**: Puppeteer (Headless Chrome)
*   **AI**: Google Generative AI SDK (Gemini)
*   **Deployment**: Docker

## ⚙️ Prerequisites

*   Node.js (v18+)
*   PostgreSQL Database (Local or Cloud like Neon/Supabase)
*   Google Gemini API Key (for AI features)

## 📥 Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/business-licensing-il.git
    cd business-licensing-il
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory based on the example below:

    ```env
    PORT=8080
    NODE_ENV=development

    # Database (PostgreSQL Connection String)
    DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

    # Auth
    JWT_SECRET=your_super_secret_key_here
    JWT_EXPIRES_IN=12h

    # AI Service
    GEMINI_API_KEY=your_google_gemini_api_key
    ```

4.  **Seed the Database:**
    Populate the database with the catalog of inspection defects and licensing items:
    ```bash
    node utils/seedDefects.js
    node utils/seedSystem.js
    ```

## 🏃‍♂️ Running Locally

Start the development server with hot-reloading:

```bash
npm run dev
```

The server will start on `http://localhost:8080`.

## 🚂 Deployment (Railway)

This project is configured for deployment on **Railway** using Docker. Railway automatically detects the `Dockerfile` and builds the environment with the necessary fonts for Puppeteer.

1.  Push your code to GitHub.
2.  Log in to Railway and create a **New Project** > **Deploy from GitHub repo**.
3.  Select this repository.
4.  Go to **Variables** and add: `JWT_SECRET`, `GEMINI_API_KEY`, and `NODE_ENV=production`.
5.  **Database**: You can add a PostgreSQL service within Railway. Railway will automatically inject the `DATABASE_URL` variable into your app service.
6.  Deploy!

## 📚 API Documentation

### Authentication
*   `POST /api/auth/register` - Register a new inspector/manager.
*   `POST /api/auth/login` - Login and receive JWT.
*   `GET /api/auth/me` - Get current user details.

### Businesses (עסקים)
*   `GET /api/businesses` - List all businesses.
*   `POST /api/businesses` - Create a new business application.
*   `GET /api/businesses/:id` - Get business details.

### Reports (דו"חות)
*   `POST /api/reports` - Create a new inspection report (Triggers AI & PDF generation).
*   `GET /api/reports/business/:businessId` - Get history for a specific business.
*   `GET /api/reports/:id` - Get a specific report.

### Licensing Items (פריטי רישוי)
*   `GET /api/licensing-items` - Get catalog of legal licensing items.

### Defects Catalog (ליקויים)
*   `GET /api/defects` - Get list of standard legal defects.

## 📄 License

ISC License.

---
**Developed for the Regional Council Dev Team.**
"# Business-Licensing-Inspection-System" 
