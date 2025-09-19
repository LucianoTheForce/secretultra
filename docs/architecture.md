# Ultragaz Character Generation Studio - Architecture

## Layout Structure

```mermaid
graph TD
    A[App Layout] --> B[Header]
    A --> C[Toolbar]
    A --> D[Main Content Area]
    A --> E[Bottom Gallery]
    
    B --> B1[Ultragaz Logo]
    B --> B2[Credits Badge]
    B --> B3[User Profile]
    
    C --> C1[Selection Tool]
    C --> C2[Transform Tool]
    C --> C3[Text Tool]
    
    D --> D1[Left Sidebar]
    D --> D2[Central View]
    D --> D3[Right Panel]
    
    D1 --> D1A[Characters Grid]
    D1 --> D1B[Poses Grid]
    D1 --> D1C[Expressions Grid]
    D1 --> D1D[Lighting Grid]
    D1 --> D1E[Scenarios Grid]
    
    D2 --> D2A[3D Viewport]
    D2 --> D2B[Prompt Bar]
    
    D3 --> D3A[Character Properties]
    D3 --> D3B[Customization Controls]
    
    E --> E1[Thumbnail Strip]
    E --> E2[Expand Button]
```

## Component Hierarchy

```
src/
├── app/
│   ├── layout.tsx (main layout with header)
│   ├── page.tsx (character studio main page)
│   └── api/
│       └── character/
│           └── generate/route.ts
├── components/
│   ├── studio/
│   │   ├── header.tsx
│   │   ├── toolbar.tsx
│   │   ├── left-sidebar.tsx
│   │   ├── viewport.tsx
│   │   ├── prompt-bar.tsx
│   │   ├── properties-panel.tsx
│   │   └── gallery.tsx
│   └── ui/ (existing shadcn components)
└── lib/
    ├── character-data.ts
    └── credits.ts
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant Database
    
    User->>UI: Enter prompt
    UI->>API: Generate character request
    API->>Database: Check credits
    Database-->>API: Credits available
    API->>API: Generate character
    API->>Database: Deduct credits
    API-->>UI: Return character
    UI-->>User: Display character