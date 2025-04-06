# Environ Frontend

A modern React-based frontend application for the Environ project, featuring AI-powered image analysis and user management capabilities.

## 🚀 Features

- **AI-Powered Image Analysis**: Integration with Google Cloud Vision and Generative AI
- **User Authentication**: Secure authentication using Supabase
- **Modern UI**: Built with React, Tailwind CSS, and Framer Motion
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Real-time Updates**: Infinite scroll and dynamic content loading
- **Interactive Elements**: Confetti animations, progress bars, and toast notifications

## 🛠️ Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router v6
- **Authentication**: Supabase
- **AI Integration**: Google Cloud Vision & Generative AI
- **UI Components**: Framer Motion, React Icons
- **Development Tools**: ESLint, PostCSS

## 📦 Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd environ-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Development

Start the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

Lint the code:
```bash
npm run lint
```

## 📁 Project Structure

```
environ-frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── context/       # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   ├── assets/        # Static assets
│   ├── styles/        # Global styles
│   └── supabase.js    # Supabase client configuration
├── public/            # Public assets
├── dist/              # Production build
└── config files       # Various configuration files
```

## 🔧 Configuration

- **Vite**: `vite.config.js`
- **Tailwind**: `tailwind.config.js`
- **PostCSS**: `postcss.config.cjs`
- **ESLint**: `eslint.config.js`
- **Vercel**: `vercel.json`

## 🚀 Deployment

The application is configured for deployment on Vercel. The deployment process is automated through the Vercel platform.

## 📝 License

[Your License Here]

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, please contact [your contact information].
