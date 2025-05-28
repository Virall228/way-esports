# WAY Esports Mini App

A modern esports tournament platform built as a Telegram Mini App.

## Features

- Tournament management and brackets
- Team registration system
- Match history tracking
- User profiles with statistics
- News feed with categories
- Multi-language support (English/Russian)
- Modern cybersport design

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- A Telegram Bot Token (for development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/way-esports.git
cd way-esports/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

### Building for Production

1. Create production build:
```bash
npm run build
```

2. Preview production build:
```bash
npm run preview
```

The production build will be in the `dist` directory.

## Deployment to Telegram Mini Apps

1. Host the contents of the `dist` directory on a static hosting service (e.g., Vercel, Netlify, or GitHub Pages)

2. Configure your Telegram Bot:
   - Go to [@BotFather](https://t.me/BotFather)
   - Select your bot
   - Choose "Bot Settings" > "Mini App Settings"
   - Add your hosted URL

3. Test your Mini App:
   - Open your bot in Telegram
   - Start the Mini App from the menu button

## Development Guidelines

### File Structure

```
src/
├── components/
│   ├── News/
│   ├── Tournaments/
│   └── Profile/
├── contexts/
├── types/
└── utils/
```

### Code Style

- Use TypeScript for type safety
- Follow React best practices
- Use styled-components for styling
- Implement responsive design
- Support both English and Russian languages

### Performance Optimization

The build process includes:
- Code splitting
- Tree shaking
- Asset optimization
- Console log removal in production
- Minification and compression

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 