# Steel City United Nations Conference (SCUNC) Website

A comprehensive digital platform designed to manage and showcase the Steel City United Nations Conference. This full-stack web application serves as the central hub for conference information, registration, and administration.

## Purpose & Overview

The SCUNC website is built to serve multiple stakeholders in the Model United Nations community:

### **For Conference Attendees**
- Browse detailed committee information and assignments
- Register for the conference with integrated form handling
- Access hotel recommendations and booking information
- View conference schedules and important updates
- Contact organizers through integrated messaging system

### **For Conference Administrators**
- Manage committee details and delegate assignments
- Update hotel partnerships and recommendations
- Handle registration data and attendee information
- Send announcements and communications
- Monitor and moderate conference content

### **For the Public**
- Learn about the Steel City United Nations Conference
- Understand the mission and goals of the organization
- Access general conference information
- Connect with the SCUNC community

## Architecture & Design

### **Full-Stack Architecture**
The application follows a modern client-server architecture pattern:
- **Frontend**: React-based single-page application (SPA)
- **Backend**: RESTful API server with Express.js
- **Database**: PostgreSQL with Supabase integration
- **Authentication**: JWT-based secure authentication
- **Email**: Integrated email service for communications

### **Key Design Principles**
- **Responsive First**: Mobile-optimized design that scales to desktop
- **Performance Focused**: Lazy loading, code splitting, and optimized assets
- **Security Minded**: Rate limiting, input validation, and secure authentication
- **User Experience**: Smooth animations, intuitive navigation, and clear feedback

## �Technical Implementation

### **Frontend Technologies**
- **React 19** - Modern UI library with hooks and functional components
- **React Router DOM** - Client-side routing for seamless navigation
- **Lucide React & React Icons** - Comprehensive icon libraries
- **React Toastify** - User-friendly notification system
- **DND Kit** - Drag and drop functionality for admin interfaces
- **Custom CSS** - Tailored styling with modern animations and glass morphism effects

### **Backend Technologies**
- **Node.js & Express.js** - Server runtime and web framework
- **PostgreSQL** - Relational database for structured data storage
- **Supabase** - Database hosting with additional backend services
- **JWT (JSON Web Tokens)** - Stateless authentication system
- **Nodemailer** - Email service integration with Gmail
- **Multer** - File upload and image handling
- **Express Rate Limit** - API protection and abuse prevention
- **Jest & Supertest** - Comprehensive testing framework

### **Data Architecture**
```
Database Schema:
├── Users (Authentication & Admin Management)
├── Committees (Conference Committee Information)
├── Hotels (Partner Hotel Details & Amenities)
├── Registrations (Attendee Registration Data)
├── Quotes (Inspirational Content Management)
├── Schedules (Conference Timeline & Events)
└── Schools (Participating Institution Data)
```

## Application Features

### **Public Interface**
- **Homepage**: Dynamic hero section with animated elements and conference highlights
- **About Section**: Detailed information about SCUNC mission and history
- **Committees Page**: Interactive showcase of available conference committees
- **Hotels Page**: Premium hotel recommendations with booking integration
- **Contact System**: Multi-purpose contact forms for inquiries and feedback

### **Registration System**
- **Student Registration**: Streamlined signup process for conference attendees
- **School Management**: Institutional registration and delegate coordination
- **Data Validation**: Comprehensive form validation and error handling
- **Email Confirmation**: Automated confirmation and communication system

### **Administrative Dashboard**
- **Content Management**: Full CRUD operations for all conference data
- **User Authentication**: Secure admin access with JWT tokens
- **File Upload**: Image management for committees and hotel partnerships
- **Secretariat Tools**: Specialized interfaces for conference organizers

## Project Organization

```
pittwebsite-harrisonwilliams/
├── client/                    # React Frontend Application
│   ├── public/               # Static assets and manifest files
│   ├── src/
│   │   ├── components/       # Reusable UI components (Navbar, Footer, Cards)
│   │   ├── pages/           # Route-specific page components
│   │   ├── assets/          # Images, backgrounds, and styling resources
│   │   ├── config/          # Firebase and Supabase configuration
│   │   └── utils/           # Custom hooks and context providers
│   └── build/               # Production-ready compiled application
├── server/                   # Node.js Backend API
│   ├── config/              # Database and external service configurations
│   ├── controllers/         # Business logic and route handlers
│   ├── middleware/          # Authentication, validation, and security
│   ├── routes/              # API endpoint definitions
│   ├── utils/               # Helper functions and services
│   └── __tests__/           # Unit and integration tests
└── README.md                # Project documentation
```

## How It Works

### **User Journey - Conference Registration**
1. **Discovery**: Users visit the homepage and explore conference information
2. **Research**: Browse available committees and hotel options
3. **Registration**: Complete the registration form with school and personal details
4. **Confirmation**: Receive email confirmation with next steps
5. **Updates**: Access ongoing conference information and updates

### **Admin Workflow - Content Management**
1. **Authentication**: Secure login with JWT token validation
2. **Dashboard Access**: Navigate to administrative interface
3. **Content Updates**: Modify committee details, hotel partnerships, or schedules
4. **File Management**: Upload and manage images for committees and hotels
5. **Communication**: Send announcements or handle inquiries through the contact system

### **System Integration**
- **Frontend-Backend Communication**: RESTful API calls with proper error handling
- **Database Operations**: Efficient PostgreSQL queries with connection pooling
- **Email Service**: Automated email sending for confirmations and communications
- **File Storage**: Integrated image upload and storage via Supabase
- **Security Layer**: Multi-level protection with rate limiting and input validation

## Security & Performance

### **Security Measures**
- **JWT Authentication**: Stateless token-based authentication for admin access
- **Rate Limiting**: API endpoint protection against abuse and spam
- **Input Validation**: Comprehensive sanitization of all user inputs
- **CORS Configuration**: Controlled cross-origin resource sharing
- **Environment Protection**: Sensitive data secured through environment variables
- **SQL Injection Prevention**: Parameterized queries and prepared statements

### **Performance Optimizations**
- **Code Splitting**: Lazy loading of React components for faster initial load
- **Image Optimization**: Compressed and appropriately sized media assets
- **Database Indexing**: Optimized queries with proper database indexing
- **Connection Pooling**: Efficient database connection management
- **Caching Strategies**: Strategic caching of frequently accessed data
- **Bundle Optimization**: Minimized and compressed production builds

## User Experience Design

### **Visual Design Philosophy**
- **Modern Aesthetic**: Clean, professional design suitable for academic conferences
- **Glass Morphism**: Contemporary visual effects with translucent elements
- **Responsive Layout**: Fluid design that adapts seamlessly across all devices
- **Accessibility**: WCAG-compliant design with proper contrast and navigation
- **Animation System**: Smooth, purposeful animations that enhance user engagement

### **Interaction Patterns**
- **Intuitive Navigation**: Clear, consistent navigation patterns throughout the application
- **Form Validation**: Real-time feedback with helpful error messages
- **Loading States**: Visual feedback during data processing and API calls
- **Toast Notifications**: Non-intrusive success and error messaging
- **Interactive Elements**: Hover effects and transitions for better user feedback

## Quality Assurance

### **Testing Strategy**
- **Unit Testing**: Comprehensive Jest tests for individual functions and components
- **Integration Testing**: API endpoint testing with Supertest framework
- **Email Service Testing**: Mocked email functionality to ensure reliable communication
- **Authentication Testing**: JWT token validation and security verification
- **Database Testing**: CRUD operation verification and data integrity checks

## Development Insights

### **API Architecture**
The backend provides a comprehensive RESTful API structure:

**Authentication Flow**
- Secure login system with JWT token generation
- Token validation middleware for protected routes
- Role-based access control for administrative functions

**Data Management**
- Full CRUD operations for all conference entities
- Optimized database queries with proper indexing
- Transaction support for data integrity

**Communication System**
- Multi-channel email service (contact, business inquiries)
- Rate-limited endpoints to prevent abuse
- Comprehensive error handling and logging

### **Frontend Architecture**
The React application follows modern development patterns:

**Component Structure**
- Functional components with React Hooks
- Custom hooks for data fetching and state management
- Reusable UI components with consistent design patterns

**State Management**
- Context API for global application state
- Local state management for component-specific data
- Optimized re-rendering with proper dependency arrays

**User Interface**
- Responsive design with CSS Grid and Flexbox
- Custom CSS animations and transitions
- Progressive enhancement for better accessibility

## Project Impact

### **Conference Management**
This platform streamlines the entire conference management process, from initial registration to final execution. It eliminates manual paperwork, reduces administrative overhead, and provides a centralized system for all stakeholders.

### **User Experience**
The modern, intuitive interface makes conference participation more accessible to students and educators. The responsive design ensures functionality across all devices, while the comprehensive information architecture helps users find what they need quickly.

### **Scalability**
Built with growth in mind, the application can accommodate increasing numbers of participants, additional committee types, and expanded functionality as the conference evolves.

## License

This project is licensed under the ISC License.

## Team

- **Development Team**: Harrison Williams
- **Project Type**: Conference Management System
- **Institution**: Steel City United Nations Conference

## Support

For support and inquiries:
- **Email**: [Contact through the website contact form]
- **GitHub Issues**: [Repository Issues Page]

---

**Made with ❤️ for the Steel City United Nations Conference**
