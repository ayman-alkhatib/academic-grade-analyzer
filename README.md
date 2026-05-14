# Academic Grade Analyzer

A modern web application for analyzing and visualizing academic grades across modules, blocks, and evaluation criteria. Built with React, Vite, and Recharts for an interactive and responsive user experience.

## 🎯 Features

- **Grade Input Wizard**: Step-by-step interface to input grades for different academic blocks and modules
- **Real-time Analysis**: Automatically calculate module averages, block averages, and general academic average
- **Dashboard View**: Comprehensive visualization of grades and performance metrics
- **Theme Toggle**: Dark and light mode support for comfortable viewing
- **Persistent Storage**: Automatically saves grades to local storage for data preservation
- **Progress Tracking**: Visual progress indicators as you input grades
- **Data Validation**: Smart validation rules with different scale support (0-20, 0-100, 0-800)
- **Decision Support**: Automatic evaluation of academic standing based on computed averages

## 🛠️ Tech Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS 4
- **Data Visualization**: Recharts 3
- **Linting**: ESLint
- **Testing**: Vitest
- **Development Server**: Vite dev server

## 📁 Project Structure

```
academic-grade-analyzer/
├── src/
│   ├── components/
│   │   └── GradeAnalyzerComponents.jsx    # Main UI components (Header, Wizard, Dashboard)
│   ├── hooks/
│   │   └── useGradeAnalyzer.js           # Custom hook for grade management logic
│   ├── utils/
│   │   └── gradeAnalyzer.js              # Core grade calculation utilities
│   ├── data/
│   │   └── coef_real.json                # Academic structure and coefficients
│   ├── App.jsx                           # Main application component
│   ├── main.jsx                          # Application entry point
│   └── index.css                         # Global styles
├── public/                                # Static assets
├── package.json                           # Project dependencies and scripts
├── vite.config.js                         # Vite configuration
├── eslint.config.js                       # ESLint rules configuration
└── README.md                              # This file
```

## 🌐 Live Demo

Try the application live: [Academic Grade Analyzer](https://ayman-alkhatib.github.io/academic-grade-analyzer/)

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd academic-grade-analyzer
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Build for Production

Create an optimized production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint to check code quality
- `npm run test` - Run tests with Vitest

## 🎨 Key Components

### App Component
Main application container that manages the overall layout and coordinates between wizard and dashboard views.

### useGradeAnalyzer Hook
Custom React hook that handles:
- Grade state management
- Theme persistence
- Calculation of averages and statistics
- Navigation between wizard steps
- Data serialization and storage

### Grade Analyzer Utilities
Core functions for:
- Computing module, block, and general averages
- Calculating scenarios and academic standing
- Grade validation and transformation
- Storing and retrieving grades from local storage

### GradeAnalyzerComponents
UI components including:
- **AppHeader**: Application header with theme toggle
- **WizardSection**: Step-by-step grade input interface
- **DashboardSection**: Comprehensive grade analysis and visualization

## 💾 Data Persistence

The application uses browser local storage to persist:
- User's selected theme (dark/light mode)
- Entered grades for all evaluations
- Wizard progress

Stored data is automatically loaded when the application starts, allowing users to resume where they left off.

## 🔢 Evaluation Scales

Different evaluation types use different scales:
- **Standard Evaluations**: 0-20
- **Campaign Evaluations** (S1_Campagne_1/2/3): 0-100
- **PIX Certification/Score**: 0-800

## 📊 How It Works

1. **Input Grades**: Navigate through the wizard, entering grades for each evaluation
2. **Automatic Calculation**: The app calculates averages for modules and blocks
3. **View Dashboard**: Switch to the dashboard to see comprehensive analysis
4. **Track Progress**: Monitor your academic standing through visual indicators

## 📄 License

This project is part of an academic initiative.

## 👤 Author

Created by Ayman Alkhatib

---

For more information or support, please open an issue in the repository.
