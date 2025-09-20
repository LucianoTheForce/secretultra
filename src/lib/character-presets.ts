import type { CharacterId } from "@/types"

export type CharacterPresetCategory = "poses" | "expressions" | "lighting" | "scenarios"

export interface CharacterPresetItem {
  id: string
  label: string
  description?: string
  prompt: string
  image: string
}

export interface CharacterConfig {
  name: string
  sheet?: string | null
  references: string[]
  categories: Record<CharacterPresetCategory, CharacterPresetItem[]>
}

export const CHARACTER_CONFIG: Record<CharacterId, CharacterConfig> = {
  ULLY: {
    name: "Ully",
    sheet: "/ultragaz-character-sheet.png",
    references: [
      "/presets/ully/reference-main.jpg",
      "/ultragaz-character-sheet.png",
    ],
    categories: {
      poses: [
        {
          id: "ully-pose-saudacao",
          label: "Saudacao calorosa",
          description: "Ully acenando para os clientes com sorriso confiante",
          prompt: "Ully acenando com a mao direita, postura heroica, sorriso confiante",
          image: "/presets/ully/pose-saudacao.jpg",
        },
        {
          id: "ully-pose-entrega",
          label: "Entrega segura",
          description: "Ully segurando um botijao com uma mao e indicando a entrega",
          prompt: "Ully segurando um botijao de gas com ergonomia correta, postura inclinada para frente",
          image: "/presets/ully/pose-entrega.jpg",
        },
        {
          id: "ully-pose-heroica",
          label: "Pronto para ajudar",
          description: "Ully em posicao dinamica, pronto para sair para uma entrega",
          prompt: "Ully em pose dinamica, joelho semiflexionado, postura pronta para acao",
          image: "/presets/ully/pose-heroica.jpg",
        },
      ],
      expressions: [
        {
          id: "ully-expressao-sorriso",
          label: "Sorriso confiante",
          prompt: "Ully com sorriso confiante e acolhedor, olhar direto para o cliente",
          image: "/presets/ully/expression-sorriso.jpg",
        },
        {
          id: "ully-expressao-determinado",
          label: "Determinado",
          prompt: "Ully com expressao determinada, sobrancelhas firmes, focado na seguranca",
          image: "/presets/ully/expression-determinado.png",
        },
        {
          id: "ully-expressao-relaxado",
          label: "Atendimento leve",
          prompt: "Ully com expressao relaxada, sorriso amigavel e acolhedor",
          image: "/presets/ully/expression-relaxado.jpg",
        },
      ],
      lighting: [
        {
          id: "ully-iluminacao-dia",
          label: "Dia ensolarado",
          prompt: "Iluminacao diurna natural, tons quentes suaves e sombras leves",
          image: "/presets/ully/lighting-dia.jpg",
        },
        {
          id: "ully-iluminacao-industrial",
          label: "Galpao industrial",
          prompt: "Iluminacao industrial com luzes altas e contrastes dramaticos",
          image: "/presets/ully/lighting-industrial.jpg",
        },
        {
          id: "ully-iluminacao-noturna",
          label: "Noite urbana",
          prompt: "Iluminacao noturna com tons azuis e destaques em neon",
          image: "/presets/ully/lighting-noturno.jpg",
        },
      ],
      scenarios: [
        {
          id: "ully-cenario-residencia",
          label: "Residencia brasileira",
          prompt: "Cenario de cozinha brasileira moderna com utensilios Ultragaz",
          image: "/presets/ully/scenario-residencial.jpg",
        },
        {
          id: "ully-cenario-industrial",
          label: "Area de abastecimento",
          prompt: "Cenario de centro de distribuicao Ultragaz com empilhadeiras e paletes",
          image: "/presets/ully/scenario-industrial.jpg",
        },
        {
          id: "ully-cenario-loja",
          label: "Loja Ultragaz",
          prompt: "Cenario de loja Ultragaz com displays de produtos e materiais de marca",
          image: "/presets/ully/scenario-loja.jpg",
        },
      ],
    },
  },
  ULTRINHO: {
    name: "Ultrinho",
    sheet: "/presets/ultrinho/reference-sheet.png",
    references: [
      "/presets/ultrinho/reference-main.png",
      "/presets/ultrinho/reference-sheet.png",
    ],
    categories: {
      poses: [
        {
          id: "ultrinho-pose-parado",
          label: "Parado",
          prompt: "Ultrinho parado em pose neutra",
          image: "/presets/ultrinho/pose-parado.png",
        },
        {
          id: "ultrinho-pose-andando",
          label: "Andando",
          prompt: "Ultrinho andando com passo curto",
          image: "/presets/ultrinho/pose-andando.png",
        },
        {
          id: "ultrinho-pose-correndo",
          label: "Correndo",
          prompt: "Ultrinho correndo com energia",
          image: "/presets/ultrinho/pose-correndo.png",
        },
        {
          id: "ultrinho-pose-bracos-levantados",
          label: "Bracos levantados",
          prompt: "Ultrinho com os bracos levantados",
          image: "/presets/ultrinho/pose-bracos-levantados.png",
        },
        {
          id: "ultrinho-pose-bracos-cruzados",
          label: "Bracos cruzados",
          prompt: "Ultrinho parado com bracos cruzados",
          image: "/presets/ultrinho/pose-bracos-cruzados.png",
        },
        {
          id: "ultrinho-pose-sentado",
          label: "Sentado",
          prompt: "Ultrinho sentado com maos nos joelhos",
          image: "/presets/ultrinho/pose-sentado.png",
        },
        {
          id: "ultrinho-pose-acenando",
          label: "Acenando",
          prompt: "Ultrinho acenando com a mao direita",
          image: "/presets/ultrinho/pose-acenando.png",
        },
        {
          id: "ultrinho-pose-apontando",
          label: "Apontando",
          prompt: "Ultrinho apontando para frente com a mao direita",
          image: "/presets/ultrinho/pose-apontando.png",
        },
        {
          id: "ultrinho-pose-lateral",
          label: "Lateral",
          prompt: "Ultrinho de lado em pose neutra",
          image: "/presets/ultrinho/pose-lateral.png",
        },
        {
          id: "ultrinho-pose-ajoelhado",
          label: "Ajoelhado",
          prompt: "Ultrinho ajoelhado com uma mao apoiada",
          image: "/presets/ultrinho/pose-ajoelhado.png",
        },
        {
          id: "ultrinho-pose-maos-na-cintura",
          label: "Maos na cintura",
          prompt: "Ultrinho com maos na cintura",
          image: "/presets/ultrinho/pose-maos-na-cintura.png",
        },
        {
          id: "ultrinho-pose-segurando-botijao",
          label: "Segurando botijao",
          prompt: "Ultrinho segurando um botijao pequeno",
          image: "/presets/ultrinho/pose-segurando-botijao.png",
        },
      ],
      expressions: [
        {
          id: "ultrinho-expressao-feliz",
          label: "Feliz",
          prompt: "Ultrinho sorrindo com alegria infantil, olhos brilhantes",
          image: "/presets/ultrinho/expression-feliz.jpg",
        },
        {
          id: "ultrinho-expressao-curioso",
          label: "Curioso",
          prompt: "Ultrinho com expressao curiosa, cabeca levemente inclinada",
          image: "/presets/ultrinho/expression-curioso.png",
        },
        {
          id: "ultrinho-expressao-surpreso",
          label: "Surpreso",
          prompt: "Ultrinho surpreso de forma divertida, boca em O e olhos arregalados",
          image: "/presets/ultrinho/expression-surpreso.jpg",
        },
      ],
      lighting: [
        {
          id: "ultrinho-iluminacao-estudio",
          label: "Estudio branco",
          prompt: "Iluminacao de estudio suave com fundo branco",
          image: "/presets/ultrinho/lighting-estudio.png",
        },
        {
          id: "ultrinho-iluminacao-festa",
          label: "Festa",
          prompt: "Luzes coloridas festivas com refletores suaves",
          image: "/presets/ultrinho/lighting-festa.png",
        },
        {
          id: "ultrinho-iluminacao-escola",
          label: "Sala de aula",
          prompt: "Iluminacao fluorescente suave de sala de aula",
          image: "/presets/ultrinho/lighting-escola.png",
        },
      ],
      scenarios: [
        {
          id: "ultrinho-cenario-estudio",
          label: "Estudio Ultragaz",
          prompt: "Cenario clean com elementos Ultragaz em destaque",
          image: "/presets/ultrinho/scenario-estudio.png",
        },
        {
          id: "ultrinho-cenario-parque",
          label: "Parque",
          prompt: "Cenario de parque urbano brasileiro em dia ensolarado",
          image: "/presets/ultrinho/scenario-parque.jpg",
        },
        {
          id: "ultrinho-cenario-escola",
          label: "Escola",
          prompt: "Cenario de sala de aula colorida com cartazes Ultragaz kids",
          image: "/presets/ultrinho/scenario-escola.jpg",
        },
      ],
    },
  },
  CUSTOM: {
    name: "Custom",
    sheet: null,
    references: [],
    categories: {
      poses: [],
      expressions: [],
      lighting: [],
      scenarios: [],
    },
  },
}
