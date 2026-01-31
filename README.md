# AI Craft Recognition

A full-stack web application for AI-powered craft recognition, built with React and Node.js.

## 📋 Project Overview

AI Craft Recognition is a modern web application that leverages artificial intelligence to identify and analyze various crafts. The project features a React-based frontend with Vite for optimal development experience and an Express.js backend with MongoDB for robust data management.

## 🚀 Features

- **AI-Powered Recognition**: Advanced craft identification using AI models
- **Modern Tech Stack**: React + Vite frontend, Express.js backend
- **Database Integration**: MongoDB with Mongoose ODM
- **RESTful API**: Well-structured API endpoints
- **Real-time Updates**: Auto-restart development server with Nodemon
- **Secure Configuration**: Environment-based configuration management
- **Error Handling**: Comprehensive error handling and validation

## 🛠️ Tech Stack

### Frontend
- React 19.2.0
- Vite 7.2.4
- Axios for API calls
- Modern CSS with responsive design

### Backend
- Node.js with Express 5.2.1
- MongoDB with Mongoose 9.1.5
- CORS enabled
- Environment variables with dotenv
- Nodemon for development

## 📁 Project Structure

```
ai-craft-recognition/
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── assets/
│   └── package.json
├── src/                    # Backend source code
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Custom middleware
│   ├── services/          # Business logic
│   ├── config/            # Configuration files
│   └── utils/             # Utility functions
├── server.js              # Entry point
├── package.json           # Backend dependencies
└── .env                   # Environment variables (not in git)
```

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (v6 or higher)
- Git

## 🔧 Installation

### 1. Clone the repository
```bash
git clone https://github.com/RaviShankar000/AI-Craft-Recognition.git
cd AI-Craft-Recognition
```

### 2. Setup Backend

```bash
# Install backend dependencies
npm install

# Copy environment variables template
cp .env.example .env

# Update .env with your configuration
# - Set your MongoDB URI
# - Configure API keys if needed
# - Set other environment variables
```

### 3. Setup Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Return to root directory
cd ..
```

## 🚀 Running the Application

### Development Mode

#### Start Backend Server
```bash
npm run dev
```
The backend server will start on `http://localhost:3000` with auto-restart enabled.

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will start on `http://localhost:5173` with hot module replacement.

### Production Mode

#### Build Frontend
```bash
cd frontend
npm run build
```

#### Start Backend Server
```bash
npm start
```

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ai-craft-recognition

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# API Keys (add as needed)
# OPENAI_API_KEY=your_key_here
# GEMINI_API_KEY=your_key_here
```

See `.env.example` for a complete list of available configuration options.

## 📡 API Endpoints

### Health Check
- `GET /health` - Check server and database status

### Basic Routes
- `GET /` - Welcome message

More endpoints will be added as features are developed.

## 🧪 Testing

```bash
npm test
```

## 📦 Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-restart
- `npm test` - Run tests

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Commit Convention
This project follows conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `config:` - Configuration changes

## 📝 License

This project is licensed under the ISC License.

## 👤 Author

**Ravi Shankar Patro**
- GitHub: [@RaviShankar000](https://github.com/RaviShankar000)

## 🙏 Acknowledgments

- React team for the amazing frontend library
- Express.js community
- MongoDB team
- Vite for blazing fast development experience

## 📞 Support

For support, please open an issue in the GitHub repository.

---

**Built with ❤️ using React, Node.js, and MongoDB**
