# WAY Esports Frontend

A modern, professional esports organization web application built with React, TypeScript, and Styled Components.

## Features

- Professional esports organization styling
- Modern UI/UX design with WAY Esports branding
- HLTV-style match statistics
- Tournament system
- Player rankings
- News section
- Wallet integration
- Live tournaments sidebar

## Tech Stack

- React 18
- TypeScript
- React Router v6
- Styled Components
- Vite

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
  ├── components/        # Reusable components
  │   ├── Events/       # Game-specific components
  │   ├── Layout/       # Layout components
  │   ├── Navigation/   # Navigation components
  │   └── ...
  ├── pages/            # Page components
  │   ├── Home/
  │   ├── Tournaments/
  │   ├── Profile/
  │   └── ...
  ├── utils/            # Utility functions
  ├── types/            # TypeScript types
  ├── styles/           # Global styles
  └── contexts/         # React contexts
```

## Required Assets

Place the following assets in the `/public/images/` directory:
- `way-esports-logo.png` - Main logo
- `tournament-banner.jpg` - Tournament banner image
- `news1.jpg`, `news2.jpg`, `news3.jpg` - News thumbnails

## Development

- Use `npm run dev` for local development
- The app will run on `http://localhost:3000`
- Changes will hot reload automatically

## Building for Production

1. Update version in `package.json`
2. Run `npm run build`
3. Production files will be in `/dist`

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

This project is private and confidential. All rights reserved. 