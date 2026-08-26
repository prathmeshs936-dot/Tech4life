# MEDHA 2026 TECH4LIFE 2026 – Medical Devices Hackathon 🚀

A modern, high-performance landing page for the **MEDHA 2026 TECH4LIFE 2026 Medical Devices Hackathon**, built with [Vite](https://vitejs.dev/), vanilla JavaScript, and CSS.

MEDHA 2026 TECH4LIFE 2026 is a 36-hour national-level innovation challenge where students, developers, and healthcare enthusiasts collaborate to prototype real-world medical device solutions. Phase 01 takes place at Ajeenkya D Y Patil University, Pune, and Phase 02 at IIT Bombay.

## ✨ Features

- **Blazing Fast Performance**: Powered by Vite for instant server starts and optimized production builds.
- **Dynamic Theming**: First-class support for both Light and Dark modes with seamless transitions and persisted user preferences.
- **Interactive UI**: Custom neon glow effects, glassmorphism panels, and a sleek, modern aesthetic.
- **Animated Particle Background**: A responsive canvas-based particle network with drifting orbs that gracefully respects `prefers-reduced-motion` settings.
- **Live Event Countdown**: Real-time countdown timer accurately tracking the event start date.
- **Fully Responsive**: Carefully crafted to look perfect on mobile devices, tablets, and desktop displays.

## 🛠️ Tech Stack

- **HTML5**: Semantic markup.
- **CSS3**: Modern CSS features including custom properties (variables), grid, flexbox, and keyframe animations.
- **JavaScript (ES6+)**: Vanilla JS for particle animations, countdown logic, and theme toggling.
- **Vite**: Next-generation frontend tooling.

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You will need [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sumitkshah09/tech4life.git
   ```
2. Navigate into the project directory:
   ```bash
   cd tech4life
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and visit the local URL provided by Vite (usually `http://localhost:5173`).

### Building for Production

To create an optimized production build, run:
```bash
npm run build
```
This will output the compiled assets into the `dist/` directory, ready to be deployed to your favorite hosting provider (Vercel, Netlify, GitHub Pages, etc.).

You can preview the production build locally with:
```bash
npm run preview
```

## ⚙️ Configuration

Before deploying, make sure to update the configuration variables located at the top of `src/main.js`:

```javascript
const CONFIG = {
  // Update with the actual Google Form or registration link
  registerUrl: 'https://forms.gle/...',
  
  // The official GitHub repository for project submissions
  submissionRepoUrl: 'https://github.com/...',
  
  // Event start date for the countdown timer
  eventDateISO: '2026-09-08T09:00:00+05:30'
};
```

## 🤝 Adding Partner Logos

To add additional sponsor or partner logos (such as IIT Bombay):
1. Place the image file in the `public/assets/` directory.
2. Update `index.html` by adding an `<img>` tag in the corresponding section (e.g., inside the `.org-strip`).

## 📄 License

Distributed under the MIT License.

