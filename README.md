# 🏛️ Steel City United Nations Conference (SCUNC) Website

A full-stack web application for the Steel City United Nations Conference, featuring a modern React frontend and robust Node.js backend with PostgreSQL database integration.

## 🌟 Features

### Frontend
- **Modern React Application** with React Router for navigation
- **Responsive Design** with mobile-first approach
- **Interactive Components** with drag-and-drop functionality
- **Real-time Animations** and smooth transitions
- **Admin Dashboard** for content management
- **Hotel Booking System** with premium hotel showcase
- **Committee Management** with detailed committee information
- **Contact Forms** with email integration
- **Registration System** for conference attendees

### Backend
- **RESTful API** built with Express.js
- **PostgreSQL Database** with Supabase integration
- **JWT Authentication** for secure admin access
- **Email Service** with Nodemailer integration
- **Rate Limiting** to prevent abuse
- **File Upload** capabilities for images
- **Comprehensive Testing** with Jest
- **Input Validation** and error handling

## 🚀 Tech Stack

### Frontend
- **React 19** - UI library
- **React Router DOM** - Client-side routing
- **Lucide React** - Modern icon library
- **React Icons** - Additional icon sets
- **React Toastify** - Toast notifications
- **DND Kit** - Drag and drop functionality
- **Firebase** - Additional services
- **Supabase** - Backend as a service

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Supabase** - Database hosting and storage
- **JWT** - Authentication tokens
- **Nodemailer** - Email service
- **Multer** - File upload handling
- **Express Rate Limit** - API rate limiting
- **Jest** - Testing framework
- **Supertest** - API testing

## 📁 Project Structure

```
pittwebsite-harrisonwilliams/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── assets/        # Images, CSS, and media files
│   │   ├── config/        # Configuration files
│   │   └── utils/         # Utility functions and hooks
│   └── build/             # Production build files
├── server/                # Node.js backend
│   ├── config/           # Database and service configurations
│   ├── controllers/      # Route handlers and business logic
│   ├── middleware/       # Express middleware functions
│   ├── routes/           # API route definitions
│   ├── utils/            # Utility functions
│   └── __tests__/        # Test files
└── README.md             # Project documentation
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database
- Gmail account for email service

### Environment Variables

Create `.env` files in both `client` and `server` directories:

#### Server `.env`
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Configuration
GMAIL_EMAIL=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
BUSINESS_EMAIL=your_business_email@gmail.com
BUSINESS_APP_PASSWORD=your_business_app_password

# Authentication
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here
API_KEY=your_api_key_here

# Server Configuration
PORT=5050
NODE_ENV=development
```

#### Client `.env`
```env
REACT_APP_API_URL=http://localhost:5050/api
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/HarrisonWillus/SCUNC.git
   cd pittwebsite-harrisonwilliams
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables**
   - Create `.env` files in both `client` and `server` directories
   - Add the required environment variables (see above)

5. **Set up the database**
   - Create a PostgreSQL database
   - Run database migrations (if applicable)
   - Seed initial data (if applicable)

## 🚀 Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   Server runs on `http://localhost:5050`

2. **Start the frontend development server**
   ```bash
   cd client
   npm start
   ```
   Client runs on `http://localhost:3000`

### Production Mode

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Start the production server**
   ```bash
   cd server
   npm start
   ```

## 🧪 Testing

### Backend Testing
```bash
cd server

# Run all tests
npm test

# Run tests in watch mode
npm run dev:test

# Run tests before starting server
npm run prestart
```

### Test Coverage
- **Email Service**: Comprehensive unit tests with mocking
- **API Endpoints**: Integration tests with Supertest
- **Authentication**: JWT token validation tests
- **Database Operations**: CRUD operation tests

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token

### Email Endpoints
- `POST /api/email/contact` - Send contact email
- `POST /api/email/business` - Send business inquiry email

### Hotel Endpoints
- `GET /api/hotels` - Get all hotels
- `POST /api/hotels` - Create new hotel (Admin)
- `PUT /api/hotels/:id` - Update hotel (Admin)
- `DELETE /api/hotels/:id` - Delete hotel (Admin)

### Committee Endpoints
- `GET /api/committees` - Get all committees
- `POST /api/committees` - Create committee (Admin)
- `PUT /api/committees/:id` - Update committee (Admin)
- `DELETE /api/committees/:id` - Delete committee (Admin)

## 🔒 Security Features

- **JWT Authentication** for admin access
- **Rate Limiting** on API endpoints
- **Input Validation** and sanitization
- **CORS Configuration** for cross-origin requests
- **Environment Variable Protection** for sensitive data
- **SQL Injection Prevention** with parameterized queries

## 🎨 UI/UX Features

- **Modern Design** with glass morphism effects
- **Smooth Animations** and transitions
- **Responsive Layout** for all device sizes
- **Interactive Elements** with hover effects
- **Loading States** and error handling
- **Toast Notifications** for user feedback
- **Dark/Light Mode** compatibility

## 🚀 Deployment

### Recommended Hosting
- **Frontend**: Vercel or Netlify
- **Backend**: Railway, Heroku, or DigitalOcean
- **Database**: Railway PostgreSQL or Supabase

### Environment Setup
1. Set production environment variables
2. Configure CORS for production domains
3. Set up SSL certificates
4. Configure custom domain
5. Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Team

- **Development Team**: Harrison Williams
- **Project Type**: Conference Management System
- **Institution**: Steel City United Nations Conference

## 📞 Support

For support and inquiries:
- **Email**: [Contact through the website contact form]
- **GitHub Issues**: [Repository Issues Page]

---

**Made with ❤️ for the Steel City United Nations Conference**
