# Fluenti - Language Learning Platform

A comprehensive language learning platform with speech therapy, emotional support, and gamification features. Built with modern web technologies and designed for multiple user roles including children, adults, and guardians.

## 🚀 Features

### Core Features
- **Speech Therapy**: Interactive pronunciation feedback and speech exercises
- **Emotional Support**: AI-powered emotional chat and support system
- **Gamification**: Achievement system and progress tracking
- **Role-Based Dashboards**: Customized experiences for children, adults, and guardians
- **Real-time Communication**: WebSocket-powered real-time features
- **Dark Mode**: Full dark/light theme support

### User Roles
- **Children**: Simplified interface with gamified learning
- **Adults**: Advanced learning tools and progress analytics
- **Guardians**: Monitoring and management capabilities for child accounts

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Router** for navigation
- **TanStack Query** for data fetching

### Backend
- **Node.js** with TypeScript
- **Express.js** web framework
- **MongoDB** with Mongoose ODM
- **WebSocket** for real-time features
- **OpenAI API** integration for AI features
- **JWT** authentication

### Development Tools
- **Drizzle ORM** for database management
- **ESLint** and **Prettier** for code quality
- **Vite** for hot module replacement
- **TypeScript** for type safety

## 📁 Project Structure

```
Fluenti/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # Base UI components (shadcn/ui)
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── speech/     # Speech therapy components
│   │   │   ├── chat/       # Chat and messaging components
│   │   │   └── dashboard/  # Dashboard components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and configurations
│   │   └── pages/          # Page components
│   └── index.html          # HTML entry point
│
├── server/                 # Backend Node.js application
│   ├── services/           # Business logic services
│   ├── routes.ts           # API route definitions
│   ├── models.ts           # Database models
│   ├── auth.ts             # Authentication logic
│   └── index.ts            # Server entry point
│
├── shared/                 # Shared code between client and server
│   └── schema.ts           # Shared TypeScript schemas
│
├── data/                   # Database files and storage
└── dist/                   # Built application files
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or cloud instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/FYPFluenti/Fluenti.git
   cd Fluenti
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/fluenti
   
   # Authentication
   JWT_SECRET=your-jwt-secret
   
   # OpenAI (for AI features)
   OPENAI_API_KEY=your-openai-api-key
   
   # Server
   PORT=3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   This will start both the frontend (Vite) and backend (Node.js) servers concurrently.

### Available Scripts

- `npm run dev` - Start development servers for both client and server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint for code quality checks
- `npm run type-check` - Run TypeScript type checking

## 🔧 Configuration

### Database Setup
The application uses MongoDB. You can either:
- Install MongoDB locally
- Use MongoDB Atlas (cloud)
- The local database files are stored in the `data/db/` directory

### Environment Variables
Key environment variables to configure:

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `PORT` - Server port (default: 3000)

## 📱 Features Overview

### Speech Therapy Module
- Real-time pronunciation analysis
- Interactive speech exercises
- Progress tracking and feedback
- Audio recording and playback

### Emotional Support System
- AI-powered emotional chat
- Mood tracking and analysis
- Supportive conversation flows
- Crisis intervention protocols

### Gamification System
- Achievement badges and rewards
- Progress tracking and statistics
- Leaderboards and competitions
- Personalized learning paths

### Role-Based Access
- **Child Dashboard**: Simplified, gamified interface
- **Adult Dashboard**: Comprehensive learning tools
- **Guardian Dashboard**: Monitoring and parental controls

## 🚀 Deployment

### Netlify Deployment
The project is configured for Netlify deployment:
```bash
npm run build
```
Then deploy the `dist` folder to Netlify.

### Render Deployment
Backend deployment configuration is provided in `render.yaml`.

### Manual Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider
3. Set up environment variables on your hosting platform
4. Ensure MongoDB is accessible from your deployment environment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Open an issue on GitHub
- Contact the development team
- Check the documentation in the `DEPLOYMENT.md` file

## 🔄 Development Status

This is an active development project. Current focus areas:
- Enhanced speech recognition accuracy
- Improved AI conversation capabilities
- Mobile responsiveness optimization
- Performance improvements

---

**Fluenti** - Empowering language learning through technology, emotional support, and personalized experiences.