# SPJIMR Salary Calculator

A React-based salary calculator tool for SPJIMR students and alumni to estimate and visualize salary components and take-home pay.

## Features

- Calculate gross-to-net salary breakdown
- Visualize salary components (HRA, PF, Tax, etc.)
- Adjustable inputs for different CTC structures
- Responsive design

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/spjimr-salary-calculator.git

# Navigate into the project
cd spjimr-salary-calculator

# Install dependencies
npm install

# Start the development server
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
```

Builds the app into the `build/` folder, optimized for production.

## Project Structure

```
spjimr-salary-calculator/
├── public/
│   └── index.html
├── src/
│   ├── App.js
│   ├── index.js
│   └── SalaryCalculator.jsx   ← Main component
├── .gitignore
├── package.json
└── README.md
```

## Deployment

You can deploy this to GitHub Pages, Vercel, or Netlify.

### GitHub Pages

```bash
npm install --save-dev gh-pages
```

Add to `package.json`:
```json
"homepage": "https://YOUR_USERNAME.github.io/spjimr-salary-calculator",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

Then run:
```bash
npm run deploy
```

## License

MIT
