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

**Important:** Start services in this order:

#### 1. Start MongoDB

Ensure MongoDB is running on your system:

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongodb

# Or use MongoDB Atlas (cloud)
```

#### 2. Start AI Service (Flask)

```bash
# From root directory
cd ai-services

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Run the service
python app.py
```

The AI service will start on `http://localhost:5001`.

**Verify it's running:**
```bash
curl http://localhost:5001/health
```

#### 3. Start Backend Server (Node.js)

Open a new terminal:

```bash
# From root directory
npm run dev
```

The backend server will start on `http://localhost:3000` with auto-restart enabled.

#### 4. Start Frontend Development Server (React + Vite)

Open another terminal:

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

#### Start Services

```bash
# Terminal 1: AI Service
cd ai-services
source venv/bin/activate
FLASK_ENV=production python app.py

# Terminal 2: Backend
npm start
```

## 🧪 Testing the Application

### Test AI Service

```bash
# Health check
curl http://localhost:5001/health

# Test prediction with image
curl -X POST http://localhost:5001/predict \
  -F "image=@/path/to/craft-image.jpg"
```

### Test Backend API

```bash
# Health check
curl http://localhost:3000/health

# Test AI integration (requires authentication)
curl -X POST http://localhost:3000/api/ai/predict \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/craft-image.jpg"
```

### Access Frontend

Open browser and navigate to `http://localhost:5173`

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ai-craft-recognition

# AI Service Configuration
AI_SERVICE_URL=http://localhost:5001

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

### AI Service

- `GET /api/ai/health` - Check AI service status
- `POST /api/ai/predict` - Upload image and get craft prediction (Protected)

### Speech-to-Text

- `GET /api/speech/status` - Check speech service status
- `POST /api/speech/transcribe` - Upload audio file for transcription (Protected)

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Crafts

- `GET /api/crafts` - Get all crafts
- `POST /api/crafts` - Create new craft (Protected)
- `GET /api/crafts/:id` - Get craft by ID
- `PUT /api/crafts/:id` - Update craft (Protected)
- `DELETE /api/crafts/:id` - Delete craft (Protected)

### File Upload

- `POST /api/upload/single` - Upload single image (Protected)
- `POST /api/upload/multiple` - Upload multiple images (Protected)

More endpoints available - see route files for complete documentation.

## 🧪 Testing

```bash
npm test
```

## 📦 Scripts

### Backend

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-restart
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### AI Service

- `python app.py` - Start Flask service
- `pip install -r requirements.txt` - Install dependencies
- `pip freeze > requirements.txt` - Update dependencies

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📚 Documentation

- [AI Service Setup Guide](ai-services/SETUP.md) - Detailed AI service setup and usage
- [Backend API Documentation](docs/API.md) - API endpoints and usage (coming soon)
- [Frontend Guide](frontend/README.md) - Frontend setup and development

## 🔧 Troubleshooting

### AI Service Issues

**Port already in use:**
```bash
# Find process using port 5001
lsof -i :5001  # macOS/Linux
netstat -ano | findstr :5001  # Windows

# Use different port
PORT=5002 python app.py
```

**Module not found:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate
pip install -r requirements.txt
```

### Backend Issues

**MongoDB connection failed:**
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify network connectivity

**AI service unavailable:**
- Ensure AI service is running on port 5001
- Check `AI_SERVICE_URL` in backend `.env`
- Verify firewall settings

### Frontend Issues

**Cannot connect to backend:**
- Ensure backend is running on port 3000
- Check `VITE_API_URL` in frontend `.env`
- Verify CORS settings

For more troubleshooting tips, see [ai-services/SETUP.md](ai-services/SETUP.md)

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
