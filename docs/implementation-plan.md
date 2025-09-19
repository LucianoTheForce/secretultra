# Ultragaz Character Generation Studio - Implementation Plan

## Overview
Transform the current boilerplate into a complete character generation studio with Ultragaz branding.

## Phase 1: Setup & Component Integration
1. **Clone v0 Repository**
   - Clone https://github.com/LucianoTheForce/v0-character-generation-studio
   - Extract and adapt relevant components

2. **Clean Boilerplate**
   - Remove setup-checklist.tsx
   - Remove starter-prompt-modal.tsx
   - Remove site-footer.tsx
   - Delete routes: /chat, /dashboard, /profile

## Phase 2: Core Layout Components

### Header Component
- Ultragaz logo (text, blue, h-12)
- UG icon (white on blue circle)
- Credits badge (e.g., "120 créditos")
- User profile photo (circular)

### Toolbar Component
- Selection tool (MousePointer2 icon) - active state
- Transform tool (Move icon)
- Text tool (Type icon)
- Visual separator
- Additional tools

### Three-Column Layout

#### Left Sidebar
- Characters section (2-column grid, smaller cards)
- Poses section (3-column grid, aspect-square)
- Expressions section (3-column grid)
- Lighting section (3-column grid)
- Scenarios section (3-column grid)

#### Central Area
- 3D viewport (placeholder canvas/image)
- Prompt bar at bottom:
  - Icon left
  - Input field (expanded)
  - Generate button right
  - Translucent background
  - "What will you imagine?" placeholder

#### Right Panel
- Character properties
- Customization sliders
- Configuration options

### Bottom Gallery
- Horizontal thumbnail strip
- Expand/collapse functionality
- Full-screen gallery mode
- 8+ character examples

## Phase 3: Functionality

### State Management
```typescript
interface AppState {
  selectedTool: 'select' | 'transform' | 'text';
  credits: number;
  galleryExpanded: boolean;
  selectedCharacter: Character | null;
  prompt: string;
}
```

### Character Generation
- Mock API endpoint
- Placeholder character data
- Credit deduction simulation

### Database Schema Updates
```sql
-- Users table (extend existing)
ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 100;

-- Characters table
CREATE TABLE characters (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255),
  prompt TEXT,
  image_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Phase 4: Styling

### Color Palette
- Primary: Ultragaz Blue (#0066CC)
- Background: Dark gray (#1a1a1a)
- Surface: Slightly lighter gray (#2a2a2a)
- Text: White/gray scale
- Accent: Blue variations

### Responsive Breakpoints
- Mobile: < 768px (single column)
- Tablet: 768px - 1024px (simplified layout)
- Desktop: > 1024px (full three-column)

## Phase 5: Mock Data

### Character Categories
```typescript
const mockData = {
  characters: [
    { id: 1, name: "Warrior", image: "/placeholder/warrior.jpg" },
    { id: 2, name: "Mage", image: "/placeholder/mage.jpg" },
    // ...
  ],
  poses: [
    { id: 1, name: "Standing", icon: "🧍" },
    { id: 2, name: "Running", icon: "🏃" },
    // ...
  ],
  expressions: [
    { id: 1, name: "Happy", icon: "😊" },
    { id: 2, name: "Angry", icon: "😠" },
    // ...
  ],
  lighting: [
    { id: 1, name: "Sunset", preview: "🌅" },
    { id: 2, name: "Studio", preview: "💡" },
    // ...
  ],
  scenarios: [
    { id: 1, name: "Forest", preview: "🌲" },
    { id: 2, name: "City", preview: "🏙️" },
    // ...
  ]
};
```

## File Structure
```
src/
├── app/
│   ├── layout.tsx (updated with new header)
│   ├── page.tsx (character studio)
│   └── api/
│       └── character/
│           └── generate/route.ts
├── components/
│   └── studio/
│       ├── header.tsx
│       ├── toolbar.tsx
│       ├── sidebar/
│       │   ├── index.tsx
│       │   ├── character-grid.tsx
│       │   ├── pose-grid.tsx
│       │   ├── expression-grid.tsx
│       │   ├── lighting-grid.tsx
│       │   └── scenario-grid.tsx
│       ├── viewport.tsx
│       ├── prompt-bar.tsx
│       ├── properties-panel.tsx
│       └── gallery.tsx
├── lib/
│   ├── mock-data.ts
│   ├── credits.ts
│   └── constants.ts
└── styles/
    └── ultragaz-theme.css
```

## Testing Checklist
- [ ] Header displays correctly
- [ ] Toolbar tools have active states
- [ ] Sidebar sections render grids properly
- [ ] Prompt bar is positioned correctly
- [ ] Gallery expands/collapses
- [ ] Credits display and update
- [ ] Responsive on mobile/tablet
- [ ] Theme colors applied throughout
- [ ] Mock generation works

## Deployment
1. Test locally
2. Build for production
3. Deploy to Vercel
4. Verify environment variables
5. Test production build

## Documentation
Create comprehensive documentation in `/docs/features/`:
- character-studio.md
- ui-components.md
- api-endpoints.md
- database-schema.md