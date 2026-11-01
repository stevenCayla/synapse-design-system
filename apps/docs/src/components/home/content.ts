import type { Lang } from '../../lib/i18n';

export const homeContent = {
  en: {
    eyebrow: 'Early release',
    title: ['One source of truth for the ', 'Synapse Medical', ' interface'],
    lede: 'Tokens, components and rules that keep every Synapse Medical screen consistent and accessible, in light and dark, for the people and the agents who build them.',
    start: 'Get started',
    browse: 'Explore the foundations',
    stats: { tokens: 'tokens', checks: 'contrast checks, all AA', components: 'components' },
    audiences: {
      kick: 'Usage',
      heading: ['Start from ', 'what you are doing.'],
      items: [
        { title: 'Building a screen', text: 'Install the package, then reuse what exists before writing any CSS.', href: 'getting-started/installation/', cta: 'Installation', icon: 'form' as const },
        { title: 'Choosing a value', text: 'Every colour, size and radius comes from a token, with its contrast measured.', href: 'foundations/colors/', cta: 'Colors', icon: 'drop' as const },
        { title: 'Working with a coding agent', text: 'Rules and machine-readable files that tell an agent what already exists.', href: 'ai/coding-agents/', cta: 'Coding agents', icon: 'code' as const },
      ],
    },
    foundations: {
      kick: 'Tokens',
      heading: ['The ', 'foundations.'],
      sub: 'Drawn here from the tokens themselves, like everything on this site.',
      items: [
        { key: 'colors', title: 'Colors' },
        { key: 'typography', title: 'Typography' },
        { key: 'spacing', title: 'Spacing' },
        { key: 'radius', title: 'Radius' },
        { key: 'shadows', title: 'Shadows' },
        { key: 'motion', title: 'Motion' },
      ],
    },
    principles: {
      kick: 'Principles',
      heading: ['What ', 'we hold to.'],
      items: [
        { title: 'Accessible by default', text: 'WCAG 2.2 AA in both themes. A state is never carried by colour alone: this is a clinical product.' },
        { title: 'One place for each value', text: 'Tokens are defined once, in JSON. CSS, JavaScript and this documentation are generated from them.' },
        { title: 'No framework to depend on', text: 'Plain CSS, standard Twig and small modules. The same code runs in the applications and on this site.' },
      ],
    },
    specimen: { label: 'Rendered by the real components' },
    cta: { title: ['Check what exists ', 'before you build.'], text: 'Every screen starts from the same tokens, components and rules.', action: 'Install the package' },
  },
  fr: {
    eyebrow: 'Version préliminaire',
    title: ["Une seule source de vérité pour l'interface ", 'Synapse Medical', ''],
    lede: "Les jetons, composants et règles qui gardent chaque écran Synapse Medical cohérent et accessible, en clair comme en sombre, pour les personnes et les agents qui les construisent.",
    start: 'Démarrer',
    browse: 'Explorer les fondations',
    stats: { tokens: 'jetons', checks: 'contrôles de contraste, tous AA', components: 'composants' },
    audiences: {
      kick: 'Usage',
      heading: ['Partez de ', 'ce que vous faites.'],
      items: [
        { title: 'Vous construisez un écran', text: "Installez le package, puis réutilisez l'existant avant d'écrire du CSS.", href: 'getting-started/installation/', cta: 'Installation', icon: 'form' as const },
        { title: 'Vous choisissez une valeur', text: 'Chaque couleur, taille et radius vient d’un jeton, avec son contraste mesuré.', href: 'foundations/colors/', cta: 'Couleurs', icon: 'drop' as const },
        { title: 'Vous travaillez avec un agent de code', text: "Des règles et des fichiers lisibles par une machine indiquent à l'agent ce qui existe déjà.", href: 'ai/coding-agents/', cta: 'Agents de code', icon: 'code' as const },
      ],
    },
    foundations: {
      kick: 'Jetons',
      heading: ['Les ', 'fondations.'],
      sub: 'Dessinées ici à partir des jetons eux-mêmes, comme tout ce site.',
      items: [
        { key: 'colors', title: 'Couleurs' },
        { key: 'typography', title: 'Typographie' },
        { key: 'spacing', title: 'Espacements' },
        { key: 'radius', title: 'Radius' },
        { key: 'shadows', title: 'Ombres' },
        { key: 'motion', title: 'Mouvement' },
      ],
    },
    principles: {
      kick: 'Principes',
      heading: ['Nos ', 'principes.'],
      items: [
        { title: 'Accessible par défaut', text: "WCAG 2.2 AA dans les deux thèmes. Un état n'est jamais porté par la seule couleur : c'est un produit clinique." },
        { title: 'Un seul endroit par valeur', text: 'Les jetons sont définis une fois, en JSON. Le CSS, le JavaScript et cette documentation en sont générés.' },
        { title: 'Aucun framework dont dépendre', text: "Du CSS simple, du Twig standard et de petits modules. Le même code tourne dans les applications et sur ce site." },
      ],
    },
    specimen: { label: 'Rendu par les vrais composants' },
    cta: { title: ['Regardez ce qui existe ', 'avant de construire.'], text: 'Chaque écran part des mêmes jetons, composants et règles.', action: 'Installer le package' },
  },
} satisfies Record<Lang, unknown>;
