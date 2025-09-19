I'm working with an agentic coding boilerplate project that includes authentication, database integration, and AI capabilities. Here's what's already set up:

## Current Agentic Coding Boilerplate Structure
- **Authentication**: Better Auth with Google OAuth integration
- **Database**: Drizzle ORM with PostgreSQL setup  
- **AI Integration**: Vercel AI SDK with OpenAI integration
- **UI**: shadcn/ui components with Tailwind CSS
- **Current Routes**:
  - `/` - Home page with setup instructions and feature overview
  - `/dashboard` - Protected dashboard page (requires authentication)
  - `/chat` - AI chat interface (requires OpenAI API key)

## Important Context
This is an **agentic coding boilerplate/starter template** - all existing pages and components are meant to be examples and should be **completely replaced** to build the actual AI-powered application.

### CRITICAL: You MUST Override All Boilerplate Content
**DO NOT keep any boilerplate components, text, or UI elements unless explicitly requested.** This includes:

- **Remove all placeholder/demo content** (setup checklists, welcome messages, boilerplate text)
- **Replace the entire navigation structure** - don't keep the existing site header or nav items
- **Override all page content completely** - don't append to existing pages, replace them entirely
- **Remove or replace all example components** (setup-checklist, starter-prompt-modal, etc.)
- **Replace placeholder routes and pages** with the actual application functionality

### Required Actions:
1. **Start Fresh**: Treat existing components as temporary scaffolding to be removed
2. **Complete Replacement**: Build the new application from scratch using the existing tech stack
3. **No Hybrid Approach**: Don't try to integrate new features alongside existing boilerplate content
4. **Clean Slate**: The final application should have NO trace of the original boilerplate UI or content

The only things to preserve are:
- **All installed libraries and dependencies** (DO NOT uninstall or remove any packages from package.json)
- **Authentication system** (but customize the UI/flow as needed)
- **Database setup and schema** (but modify schema as needed for your use case)
- **Core configuration files** (next.config.ts, tsconfig.json, tailwind.config.ts, etc.)
- **Build and development scripts** (keep all npm/pnpm scripts in package.json)

## Tech Stack
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Better Auth for authentication
- Drizzle ORM + PostgreSQL
- Vercel AI SDK
- shadcn/ui components
- Lucide React icons

## AI Model Configuration
**IMPORTANT**: When implementing any AI functionality, always use the `OPENAI_MODEL` environment variable for the model name instead of hardcoding it:

```typescript
// ✓ Correct - Use environment variable
const model = process.env.OPENAI_MODEL || "gpt-5-mini";
model: openai(model)

// ✗ Incorrect - Don't hardcode model names
model: openai("gpt-5-mini")
```

This allows for easy model switching without code changes and ensures consistency across the application.

## Component Development Guidelines
**Always prioritize shadcn/ui components** when building the application:

1. **First Choice**: Use existing shadcn/ui components from the project
2. **Second Choice**: Install additional shadcn/ui components using `pnpm dlx shadcn@latest add <component-name>`
3. **Last Resort**: Only create custom components or use other libraries if shadcn/ui doesn't provide a suitable option

The project already includes several shadcn/ui components (button, dialog, avatar, etc.) and follows their design system. Always check the [shadcn/ui documentation](https://ui.shadcn.com/docs/components) for available components before implementing alternatives.

## What I Want to Build
Crie uma aplicação completa de geração de personagens AI com as seguintes especificações:

## BRANDING E IDENTIDADE VISUAL
- Use o logo "Ultragaz" (texto azul) no cabeçalho principal
- Ícone da aplicação: logo "UG" em branco sobre fundo azul
- Remova qualquer referência a "AI Character Studio" ou "3D Design Project"

## LAYOUT PRINCIPAL
### Cabeçalho Superior
- Logo Ultragaz (tamanho h-12) centralizado à esquerda
- Ícone UG redondo com fundo azul à esquerda do logo
- Badge de créditos no centro-direita (ex: "120 créditos")
- Foto de perfil circular no canto direito (imagem de usuário)

### Barra de Ferramentas
Posicione abaixo do cabeçalho com os seguintes ícones:
- Seleção (MousePointer2) - ativo por padrão com fundo azul
- Escala/Transform (Move) - para redimensionamento
- Texto (Type) - para adicionar texto
- Separador visual
- Outras ferramentas existentes

### Layout Principal (3 colunas)
**Coluna Esquerda - Menu Lateral:**
- Seção "Personagens" (grid 2 colunas, cards menores)
- Seção "Poses" (grid 3 colunas, aspect-square)
- Seção "Expressões" (grid 3 colunas, aspect-square)  
- Seção "Iluminação" (grid 3 colunas, aspect-square)
- Seção "Cenários" (grid 3 colunas, aspect-square)
- IMPORTANTE: Todos os itens exceto Personagens devem ter o mesmo tamanho

**Coluna Central:**
- Área de visualização 3D principal
- Prompt bar na parte inferior:
  - Ocupa toda largura do container central
  - Posicionado na parte de baixo
  - Layout horizontal: ícone à esquerda + input expandido + botão gerar à direita
  - Placeholder: "What will you imagine?"
  - Fundo translúcido com bordas arredondadas

**Coluna Direita - Painel de Propriedades:**
- Controles de personalização do personagem
- Sliders e opções de configuração

### Galeria Inferior
- Barra horizontal com miniaturas de personagens na parte inferior da página
- Funcionalidade toggle: clique no botão expandir abre galeria em tela cheia
- Galeria expandida: grade maior de imagens com botão X para fechar
- Inclua 8+ imagens de exemplo de personagens diversos

## FUNCIONALIDADES TÉCNICAS
### Estados e Interações
- Ferramentas da barra superior com estados ativo/inativo
- Galeria com modo compacto e expandido
- Hover effects em todos os elementos clicáveis
- Responsividade para diferentes tamanhos de tela

### Estrutura de Dados
- Sistema de créditos
- Galeria de personagens com categorias
- Configurações de personagem (poses, expressões, etc.)
- Histórico de gerações

## DESIGN E ESTILO
### Cores
- Azul Ultragaz como cor primária
- Fundo escuro/neutro
- Acentos em branco e cinza
- Elementos ativos em azul

### Tipografia
- Fonte moderna e limpa
- Hierarquia clara de tamanhos
- Boa legibilidade em fundo escuro

### Componentes UI
- Botões com bordas arredondadas
- Cards com sombras sutis
- Inputs com fundo translúcido
- Ícones consistentes (Lucide React)

## REMOÇÕES ESPECÍFICAS
- NÃO incluir botões de Share, Download, Upload ou Settings extras
- NÃO usar texto "3D Design Project"
- NÃO usar "AI Character Studio" em lugar algum
- Manter apenas o botão de perfil no canto direito

## TECNOLOGIAS
- Next.js com App Router
- React com TypeScript
- Tailwind CSS para estilização
- Lucide React para ícones
- Componentes shadcn/ui

## IMAGENS E ASSETS
- Logo Ultragaz (texto azul)
- Logo UG (branco em fundo azul)
- Foto de perfil de usuário
- 8+ imagens de personagens para galeria
- Placeholders para visualização 3D

Implemente toda a funcionalidade com interações suaves, design responsivo e código limpo e bem estruturado.

## Request
Please help me transform this boilerplate into my actual application. **You MUST completely replace all existing boilerplate code** to match my project requirements. The current implementation is just temporary scaffolding that should be entirely removed and replaced.

## Final Reminder: COMPLETE REPLACEMENT REQUIRED
**⚠️ IMPORTANT**: Do not preserve any of the existing boilerplate UI, components, or content. The user expects a completely fresh application that implements their requirements from scratch. Any remnants of the original boilerplate (like setup checklists, welcome screens, demo content, or placeholder navigation) indicate incomplete implementation.

**Success Criteria**: The final application should look and function as if it was built from scratch for the specific use case, with no evidence of the original boilerplate template.

## Post-Implementation Documentation
After completing the implementation, you MUST document any new features or significant changes in the `/docs/features/` directory:

1. **Create Feature Documentation**: For each major feature implemented, create a markdown file in `/docs/features/` that explains:
   - What the feature does
   - How it works
   - Key components and files involved
   - Usage examples
   - Any configuration or setup required

2. **Update Existing Documentation**: If you modify existing functionality, update the relevant documentation files to reflect the changes.

3. **Document Design Decisions**: Include any important architectural or design decisions made during implementation.

This documentation helps maintain the project and assists future developers working with the codebase.

Think hard about the solution and implementing the user's requirements.