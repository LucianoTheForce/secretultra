# Ultragaz Character Generation Studio

An AI-powered character generation studio for creating Ultragaz mascots and brand characters using Next.js, TypeScript, and Google Gemini AI.

## 🎨 Features

- **AI-Powered Character Generation**: Generate detailed character descriptions using Google Gemini AI
- **Interactive 3D Studio Interface**: Three-panel layout with character selection, visualization, and properties
- **Character Presets**: Pre-configured characters (ULLY, ULTRINHO) with customization options
- **Real-time Preview**: Live visualization of character modifications
- **Preset Library**: Poses, expressions, backgrounds, and lighting presets
- **Responsive Design**: Optimized for various screen sizes

## 🚀 Tech Stack

- **Framework**: Next.js 15.4.6 with Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI Integration**: Vercel AI SDK with Google Gemini 2.0 Flash
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Deployment**: Vercel Edge Runtime

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/ultragaz-character-studio.git
cd ultragaz-character-studio
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your Google Gemini API key to `.env.local`:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

## 🏃‍♂️ Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000/studio](http://localhost:3000/studio) to see the application.

## 🏗️ Project Structure

```
├── app/
│   ├── studio/           # Main studio interface
│   ├── api/
│   │   └── images/
│   │       └── generate/ # AI generation endpoint
│   └── layout.tsx        # Root layout
├── src/
│   ├── components/       # React components
│   │   ├── studio/      # Studio-specific components
│   │   └── ui/          # Reusable UI components
│   └── lib/             # Utility functions
├── public/              # Static assets
└── docs/               # Documentation
```

## 🎯 Usage

1. **Select a Character**: Choose from ULLY, ULTRINHO, or create a custom character
2. **Enter a Prompt**: Describe the character you want to generate
3. **Generate**: Click the generate button to create AI-powered descriptions
4. **Customize**: Use the preset library to adjust poses, expressions, and backgrounds
5. **Export**: Save or share your generated characters

## 🔧 Configuration

### Environment Variables

- `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google Gemini API key (required for AI features)
- `NEXT_PUBLIC_APP_URL`: Your application URL (for production)

### AI Model Configuration

The app uses Google Gemini 2.0 Flash Preview model. You can modify the model settings in:
```typescript
// app/api/images/generate/route.ts
const model = google('gemini-2.0-flash-exp')
```

## 📝 API Endpoints

### Generate Character Description
```
POST /api/images/generate
```

Request body:
```json
{
  "prompt": "A friendly Ultragaz mascot",
  "style": "cartoon",
  "characterType": "ULLY"
}
```

## 🚢 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/ultragaz-character-studio)

1. Click the button above
2. Configure your environment variables
3. Deploy!

### Manual Deployment

```bash
npm run build
npm run start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Ultragaz for brand assets and character designs
- Vercel for hosting and AI SDK
- Google for Gemini AI model
- shadcn/ui for beautiful components

---

Built with ❤️ for Ultragaz Character Generation