# Plan d'extraction du Design System Synapse

**Statut :** décisions D1 à D9 prises, validation finale du plan en attente. Analyse seule : aucun code écrit, aucun fichier déplacé, rien de modifié dans `synapse-app`.

**Base de l'audit :** `origin/develop` de `synapse-app` à `acae553`, lu dans un clone séparé. Le checkout local `develop` est à `a35cb1d`, en retard sur l'origine. Les chiffres viennent de comptages `grep` sur ce commit ; ils mesurent le code, pas le rendu dans le navigateur. Les ratios de contraste sont calculés sur les couples de couleurs nominaux, pas écran par écran.

**Décisions déjà prises :**

- URL cible : `design.synapse-medical.fr` (remplace `design.synapse.com` de la mission).
- Nom du package npm : `@synapse-medical/design` (§9.3).
- Le site reprend aussi le contenu de `/settings/design`, en plus du reste de la mission ; le périmètre de l'audit reste toute l'interface. La page reste dans l'application jusqu'à sa condition de retrait (§4.2).

## Décisions

| # | Décision | Statut | Choix |
|---|---|---|---|
| D1 | Comment l'application reçoit le Design System | Décidé | Package Composer `synapse/design`, depuis ce dépôt rendu public (§9.2) |
| D2 | Bootstrap | Décidé | Moteur **temporaire** pendant la migration. À terme, aucune dépendance à Bootstrap ni à un framework : on reprend les éléments utiles dans notre code et on construit nos composants ([#1](https://github.com/stevenCayla/synapse-design-system/issues/1), §3.4, Phase 11) |
| D3 | Couleur de marque | Décidé | **`#4f46e5`**, déjà celle de `synapse-www` et `synapse-docs`. Remplace `#6d4aff` dans l'application (§8.4, §18.3) |
| D4 | Préfixe | Décidé | `si` pour les classes et les variables (`.si-badge`, `--si-color-text`) |
| D5 | Hébergement | Décidé | Cloudflare Workers Static Assets |
| D6 | Visibilité | Décidé | Site et dépôt publics, sans authentification, préproduction `noindex`. Aucune donnée clinique, ni sur le site ni dans le dépôt |
| D7 | Langue du site | Décidé | Anglais par défaut (à la racine), français sous `/fr/` (§10). `synapse-docs` a le même modèle à deux langues, mais avec le français à la racine |
| D8 | Branches | Décidé | `main` seule ; un push déploie `dev-design` ; un workflow lancé à la main avec le numéro de version pose le tag `vX.Y.Z` et publie la release et la production (§16) |
| D9 | `/settings/design` | Décidé | Supprimer le lien de menu et le contenu de la page, sans lien de remplacement ni redirection (§4.2) |

À décider avant la 1.0, sans bloquer le démarrage : la police de titres (Fraunces ou Inter). Jusque-là, rien ne change à l'écran.

---

## 1. Executive summary

Synapse a déjà un vrai système visuel, mais dispersé. Il n'y a pas une source de vérité : il y en a au moins sept.

- **Les jetons officiels ne sont presque pas utilisés.** `theme.css` déclare 8 espacements (`--space-*`) : 0 usage. Les `--radius-*` : 4 usages. Le système réellement utilisé, ce sont `--app-*` (985 usages) et `--wz-*` (519 usages).
- **Le même sens est redéfini famille après famille.** `--app-*`, `--wz-*`, `--im-*`, `--sheet-*`, `--os-*`, et `--cfg-*` avec la PR #341. Le gris « texte secondaire » existe en plusieurs valeurs, dont certaines ne passent pas AA.
- **Les écrans récents sont les bonnes références.** L'assistant (`--wz-*`) et la configuration (`--cfg-*`, en PR) sont déjà tokenisés, thémés et pensés pour le contraste. Les valeurs sémantiques cibles peuvent en être tirées.
- **La page `/settings/design` montre les composants, mais n'est source de rien.** Elle recopie 56 couleurs en dur et ses exemples de code à la main, reste réservée aux administrateurs et ignore l'assistant, le menu latéral et les états vides.

**Ce que je propose, en cinq choix structurants :**

1. **Design System CSS d'abord, sans framework à terme.** L'application est en Twig sans build Node : des composants React ou Web Components imposeraient une réécriture sans bénéfice proportionné. Un composant, c'est du CSS `si-*`, un contrat HTML, un partiel Twig quand la structure le justifie, et un petit module JS si besoin. Bootstrap reste en place le temps de la migration, puis disparaît ([#1](https://github.com/stevenCayla/synapse-design-system/issues/1)).
2. **Un seul package, `@synapse-medical/design`,** au lieu de `tokens` et `design` séparés. Un seul numéro de version, et des points d'entrée distincts pour ceux qui ne veulent que les jetons.
3. **L'application reçoit une version figée du package,** sans registre npm ni Node côté serveur (§9.2).
4. **Une fixture par état de composant.** Elle produit à la fois l'aperçu de la documentation, le test d'accessibilité et le test visuel. C'est ce qui rend Storybook inutile pour l'instant.
5. **Migration sans changement visuel au départ.** On introduit des alias (`--app-text: var(--si-color-text)`) avec les valeurs actuelles et une référence de captures d'écran prise avant. Les corrections visuelles, dont celles de contraste, viennent ensuite dans des releases séparées.

**Le principal risque technique** est de faire rendre les vrais partiels Twig par Astro. Il est levé par un essai en Phase 1, avec une solution de repli (§11.3).

---

## 2. Audit de l'existant

### 2.1 Pile technique

| Élément | Constat |
|---|---|
| Rendu | Twig, 200 templates, 39 774 lignes. Pas de `symfony/ux-twig-component` |
| Assets | AssetMapper, `importmap.php`, pas de build Node ni de SCSS. Node existe en CI seulement, pour les tests e2e |
| Framework UI | Bootstrap 5.3.8 : CSS par l'importmap, JS commité dans `assets/lib/bootstrap/` |
| Icônes | Bootstrap Icons 1.11.3 : 1 955 usages de 292 icônes distinctes. 41 `<svg>` en ligne dans 4 fichiers |
| Autres dépendances UI | `choices.js` 11.2.4, `sortablejs` 1.15.7, `idiomorph`, Stimulus 3.2.2 (un seul contrôleur) |
| Thème | `html[data-theme]`, script anti-flash en ligne dans `base.html.twig` et `base_frame.html.twig`, clé `synapse-theme` |
| Polices | Inter, Fraunces, Nunito auto-hébergées (woff2 variable, sous-ensemble latin). Mono : pile système |
| Logo | `assets/images/logo.svg`, inséré par `app_logo()` (`src/Twig/LogoExtension.php`, chemin injecté) |
| Tests | Playwright e2e (42 fichiers de scénarios). Aucune capture visuelle, aucun contrôle axe |
| Lint | super-linter en CI ; le code note un conflit entre `stylelint-config-standard` et les noms BEM |
| Convention | `docs/code-convention/CSS-convention.md` : BEM et CSS Nesting |
| Dépendances front | Dependabot ne couvre pas l'importmap (`AGENTS.md`) |

**Bootstrap reste en thème clair en permanence.** `data-bs-theme` n'apparaît nulle part. Tout le sombre est donc écrit à la main : 211 sélecteurs `data-theme` dans `login.css`, 81 dans `app.css`, 17 dans `badges.css`, 16 dans `2fa.css`.

**CSP (`SecurityHeadersSubscriber`) :** `script-src` avec nonce, mais `style-src 'self' 'unsafe-inline'` : les styles en ligne sont donc autorisés aujourd'hui, ce que l'inventaire de départ présentait autrement. Polices et images limitées à `'self'` (plus `data:` pour les images) : aucun CDN possible.

### 2.2 CSS (`assets/styles/`, 10 705 lignes)

Sur l'ensemble : **1 014 couleurs hexadécimales** dont 912 à 6 chiffres (le chiffre de l'inventaire), **190 valeurs distinctes**, **737 `rgb()`/`rgba()`**.

| Fichier | Lignes | Hex | rgb(a) | `var()` | `!important` | Variables déclarées |
|---|---|---|---|---|---|---|
| `app.css` | 2 771 | 152 | 105 | 327 | 21 | 45 |
| `ecrf-builder.css` | 2 403 | 327 | 60 | 135 | 26 | 0 |
| `login.css` | 2 051 | 240 | 363 | 2 | 26 | 2 |
| `sidebar.css` | 1 176 | 60 | 53 | 94 | 21 | 10 |
| `study-wizard.css` | 725 | 37 | 17 | 448 | 5 | 50 |
| `org-switch.css` | 344 | 8 | 18 | 42 | 0 | 20 |
| `theme.css` | 236 | 32 | 18 | 24 | 0 | 45 |
| `toast.css` | 195 | 14 | 8 | 1 | 5 | 0 |
| `import.css` | 194 | 33 | 9 | 129 | 0 | 36 |
| `2fa.css` | 190 | 25 | 10 | 0 | 1 | 0 |
| `badges.css` | 146 | 35 | 70 | 9 | 0 | 0 |
| `study-sheet.css` | 140 | 34 | 0 | 29 | 0 | 30 |
| `therapeutic-area.css` | 52 | 13 | 3 | 16 | 0 | 0 |
| `fonts.css`, `environment-banner.css`, `buttons.css` | 82 | 4 | 3 | 7 | 0 | 0 |

`ecrf-builder.css` n'a aucun sélecteur de thème sombre : ses 135 `var()` suivent le thème, ses 327 couleurs en dur non. Le rendu sombre du builder reste à contrôler à l'écran.

### 2.3 Templates

| Mesure | Valeur |
|---|---|
| Attributs `style="..."` | **1 260** (`study/show_v2` 154, `settings/design` 88, `ecrf_record/fill` 61, `user_access/index` 51, `team/index` 49) |
| Couleurs hex à 6 chiffres | **686** (`settings/design` 56, `site/new` 54, `site/index` 47, `home/index` 44, `study/show_v2` 40) |
| Fichiers avec bloc `<style>` | 14 (`site/new` 475 lignes, `settings/design` 404, `site/index` 278, `home/index` 200, `team/index` 163, `study/show_v2` 127) |
| Variables CSS déclarées en template | `site/new`, `study/show_v2` |
| Partiels `_*.twig` | 67 |
| Macros | 28 macros, dont `_macros/{badges,actions,cards}` et `macros/{_tabs,_nav}` |
| Formulaires | 25 classes dans `src/Form`, 223 `form_widget()`, 197 `form_label()`, **aucun `form_theme`** |

### 2.4 Foundations réellement constatées

| Foundation | Déclaré | Utilisé |
|---|---|---|
| **Espacement** | `--space-1..8` (4 à 64 px) | 0 usage de `var(--space-*)`. Valeurs en dur : `gap` 8 px (60), 6 px (46), 10 px (35), 12 px (25) |
| **Radius** | `--radius-sm` 12, `md` 18, `lg` 24, `xl` 32 | 4 usages. En dur : 10 px (51), 6 px (37), 8 px (36), 7 px (18), 4 px (18). Échelle déclarée et usage réel ne coïncident pas |
| **Typographie** | `--font-body`, `--font-display` | **112 tailles distinctes**, dont `.78rem` et `0.78rem` comptées séparément. Au moins 170 déclarations sous `.75rem` (12 px), jusqu'à `.58rem` (9,3 px) |
| **Ombres** | `--shadow-soft`, `float`, `glow` (2 usages) | 79 `box-shadow` distincts |
| **Points de rupture** | Aucun | 15 valeurs : 380, 420, 480, 520, 576, 640, 700, 768, 800, 900, 992, 1100, 1200, 1300, 1400 px |
| **Z-index** | Aucun | De 1 à 9999 sans échelle (`9999` ×5, `9998`, `9990`, `2000`, `1050`, `1030`) |
| **Motion** | `--transition` .22s | Une dizaine de durées (.12s à .25s). `prefers-reduced-motion` dans 3 fichiers seulement : `import`, `login`, `org-switch` |
| **Couleurs marque** | `--color-brand-*`, dont `--color-brand-600: #6947ff` | `#6d4aff` (82), `#4f46e5` (37), `#6366f1` (26), `#4338ca` (15), `#5a34f2` (9) : deux familles, violet et indigo |

### 2.5 Composants : qui existe, combien de fois

| Composant | Implémentations constatées | Évaluation |
|---|---|---|
| **Bouton** | `.btn` Bootstrap (538 usages), redéfini dans `theme.css` ; `.button` (hérité) ; `wz-btn`, `im-btn`, `ud-btn`, `pr-btn`, `cfg-btn` (PR #341). **une cinquantaine de classes de base** contenant `btn` ou `button` | Forte duplication |
| **Badge** | `.badge` Bootstrap, `.badge` de `theme.css`, `si-badge`, `im-badge`, `cbadge`, `health-badge`, `notif-badge`, `sso-badge`, `team-card-badge`, `user-status-badge`, `hds-badge` | `si-badge` est la meilleure base |
| **Modale** | Bootstrap `.modal` (15 fichiers), `<dialog>` natif (4 occurrences, dans `base.html.twig` et `_session_guard`), `invite-modal`, `_confirm_modal` | Deux techniques à arbitrer |
| **Tiroir** | Bootstrap `.offcanvas` (10 fichiers), habillé par `feedback-`, `hc-`, `health-`, `jt-`, `notif-`, `team-`, `ud-` ; `DrawerManager` pour le chargement | Comportement déjà factorisé, pas le style |
| **Toast** | `toast.css`, `toast.js`, `_toasts` | Unique : bon candidat |
| **Confirmation** | `confirm-modal.js`, `_confirm_modal`, `_macros/actions` | Unique : bon candidat. Libellés français en dur dans le JS |
| **Alerte** | Bootstrap `.alert`, `auth-alert`, `ud-status-alert`, « banners » et « note boxes » de la page design | À regrouper |
| **Carte** | `.card` Bootstrap redéfini dans `theme.css` (flou, radius 24) ; `team-card`, `im-card`, `entity_card` | À clarifier |
| **Tableau** | `.table`, `ul-table`, `ul-log-table`, `im-table`, `regadm-table`, `wz-sites-table`, `hc-*-table` | `ul-table` et sa barre d'outils sont la base générique |
| **Onglets** | `people-tabs`, `notif-tabs`, `ud-tab-btn`, `macros/_tabs` ; `nav-tabs` Bootstrap 0 usage dans les templates | Plusieurs variantes pour un même besoin |
| **Formulaires** | `.form-control` (224), `.form-select` (87), `.form-check` (173), plus les champs de l'assistant et de l'authentification | Pas de `form_theme` : structure répétée à la main |
| **Listes déroulantes enrichies** | `choices.js` (builder eCRF), `therapeutic-area-combobox`, `job-title-select` | Trois solutions |
| **KPI** | `_kpi_card`, `si-kpi` | Unique : bon candidat |
| **Avatar** | `avatar`, `user/_avatar` (20 inclusions), `notif-avatar`, `sidebar-avatar`, `sidebar-org-avatar`, `ud-avatar-lg` | À regrouper |
| **Puce (chip)** | `im-chip`, `ud-chip`, `wz-chip`, `wz-sitechip`, `wz-visit-chip`, `field-*-chip` | Générique à créer |
| **État vide** | Une dizaine de familles : `wz-empty`, `sheet-empty`, `ud-empty`, `notif-empty`, `ul-empty`, `si-empty`… | Générique à créer |
| **Chargement** | `spinner-border` (15), `skeleton`, `sd-skeleton`, `ud-loading`, `notif-loading`, `submit-spinner` | Générique à créer |
| **Pagination** | 2 usages de `pagination`, plus `pr-pager-btn` | Peu utilisée |
| **Infobulle** | 0 usage de la classe `tooltip` | **Ne pas la créer** tant que le besoin n'est pas établi |
| **Coquille d'application** | `sidebar.css`, `_sidebar_study`, en-tête et pied dans `app.css` | Structure générique, contenu métier |

### 2.6 JavaScript lié à l'interface

| Fichier | Lignes | API | Classement |
|---|---|---|---|
| `theme.js` | 52 | Bouton de thème | Design System. Libellés français en dur |
| `toast.js` | 291 | `window.showToast` | Design System |
| `confirm-modal.js` | 94 | `window.confirmModal` | Design System. Libellés français par défaut |
| `drawer-manager.js` | 145 | `window.DrawerManager` | Design System. Injecte du HTML avec `style=` |
| `password-strength.js` | 108 | | Design System plus tard, libellés à passer en paramètres |
| `sidebar.js` | 100 | | Structure à extraire plus tard |
| `therapeutic-area-combobox.js` | 313 | | Cœur combobox générique plus tard, le reste métier |
| `org-switch.js`, `session-guard.js`, `feedback.js`, `death-checker.js`, `job-titles-drawer.js`, `study-wizard.js`, `import-flow.js`, `ecrf-builder.js`, `ecrf-engine.js` | | | Application |

### 2.7 Page `/settings/design`

`src/Controller/DesignSystemController.php`, route `app_settings_design`, `ROLE_ADMIN`. Template de 2 474 lignes : 404 de style en ligne, 88 `style=`, 56 couleurs en dur, un script en ligne à partir de la ligne 2245 (démos de toasts, navigation de sections). La reprise est détaillée au §4.2.

### 2.8 Documentation et sources existantes

- `docs/code-convention/CSS-convention.md`, à reprendre dans le guide de contribution. Il est synchronisé vers `synapse-docs` : y laisser un renvoi plutôt que le supprimer.
- `AGENTS.md` de l'application : ne mentionne pas encore de Design System. Un renvoi y sera ajouté.
- Maquette (copie locale non versionnée du 18 octobre) : `lib/tokens.js` et `lib/components.jsx`. Sombre par défaut, surfaces `#0B0F1A`, `#1A2035`. Le projet de design en ligne n'a pas été consulté. Elle reste une référence d'intention, pas une source de vérité : les valeurs retenues iront dans le Design System, et c'est la maquette qui devra les suivre.
- `synapse-www/src/styles/tokens.css` et `synapse-docs/src/styles/synapse.css` : jetons propres (`--accent`, `--sy-*`), `#4f46e5`, Nunito, Newsreader, JetBrains Mono. Autre source de vérité, à traiter après l'application.

### 2.9 Pull requests en attente

Audit fait sur leurs branches distantes. Toutes sont en brouillon et non fusionnées : **ces fichiers peuvent encore changer, ces constats sont provisoires.**

| PR | Branche | Impact UI | Conséquence |
|---|---|---|---|
| #341 | `feat/study-configuration-redesign` | Nouveau `study-configuration.css` (236 lignes, 39 hex, 33 blocs `.cfg-*`), famille `--cfg-*`, `cfg-btn` | Une famille de plus, mais de bonne qualité : source pour la sémantique, en particulier `*-soft` et `*-line` |
| #351 | `feat/sidebar-sections` | `sidebar.css` (+68), `base.html.twig` (154 lignes modifiées), nouveau `_sidebar_group` | Le lien vers `/settings/design` passe aux lignes 249-250, le test de route reste ligne 94. Le retrait doit se faire après cette fusion |
| #339 | `feat/import-per-eye` | `import.css` (+17), `import-flow.js` | Faible |
| #347 | `feat/dev-profile-switcher` | `profile-switcher.css` (46 lignes, 3 hex), JS de 157 lignes, outil de développement | Reste dans l'application. Ne pas documenter |
| #350 | `fix/wizard-calendar-presets` | `study-wizard.js` seul | Aucun |
| #343 | `docs/ophthalmology-acceptance-test` | Documentation seule, absente de l'inventaire | Aucun |

**Aucune de ces PR ne touche `app.css`, `theme.css` ou `theme.js`.** Le pont de jetons de la Phase 4 ne devrait donc pas entrer en conflit avec elles. L'inventaire annonce aussi une PR de corrections sur l'icône du thème, qui touchera sans doute `theme.js` : à reprendre avant d'extraire ce fichier.

---

## 3. Problèmes identifiés

### 3.1 Sources de vérité multiples

Le même sens sous sept noms :

| Sens | Application | Assistant | Import | Fiche | Changement d'org | Configuration (#341) | Docs |
|---|---|---|---|---|---|---|---|
| Surface | `--app-surface` | `--wz-bg` | `--im-bg` | `--sheet-*` | `--os-bg` | `--cfg-card` | `--sy-bg` |
| Texte secondaire | `--app-text-muted` | `--wz-muted` | `--im-muted` | `--sheet-*` | `--os-dim` | `--cfg-muted` | `--sy-ink2` |
| Accent | `--accent` | `--wz-accent` | `--im-accent` | `--sheet-*` | `--os-violet` | `--cfg-accent` | `--sy-accent` |

`--app-bg`, `--app-surface`, `--app-border` et `--app-text` sont en outre déclarés à la fois dans `theme.css` et `app.css`.

### 3.2 Contraste (WCAG 2.2 AA)

| Couple | Ratio | Seuil 4,5:1 (texte normal) |
|---|---|---|
| Clair `--app-text-faint` `#9ca3af` sur `#ffffff` | 2,54 | Échec |
| Clair pied de page `#9ca3af` sur `#f0f2f8` | 2,27 | Échec |
| Sombre `--app-text-faint` `#334155` sur `#0f1629` | **1,74** | Échec |
| Sombre `--app-text-muted` `#64748b` sur `#0f1629` | 3,78 | Échec |
| Clair `--app-text-muted` `#6b7280` sur `#f0f2f8` | 4,32 | Échec |
| Sombre `#6d4aff` utilisé en texte sur `#0f1629` | 3,49 | Échec |
| `#22c55e`, `#f59e0b`, `#ef4444` en texte sur blanc | 2,28 / 2,15 / 3,76 | Échec |
| Clair `--wz-faint` `#7a8197` sur blanc | 3,88 | Échec en texte normal |
| Clair `--wz-muted` `#4f566b` sur blanc | 7,30 | OK |
| Sombre `--wz-muted` `#b0bacd` sur `#0f1629` | 9,21 | OK |
| `#6d4aff` sur blanc, et blanc sur `#6d4aff` | 5,15 | OK |
| Sombre `#8a7cff` sur `#0f1629` | 5,49 | OK |

Le ratio d'un couple ne dit pas où il est employé : l'audit axe de la Phase 9 situera les écarts réels. Les écrans récents appliquent déjà le bon niveau, le reste de l'application non. S'ajoutent les textes de moins de 12 px (§2.4), qui ne contreviennent pas à une règle WCAG précise mais gênent sur une application clinique.

### 3.3 Dette et incohérences

- **Héritage de `theme.css` :** commentaires de choix de polices et de référence à un autre produit, `.hero`, `.button--*`, `.card--dark` (0 usage), dégradés (5 usages). Règles globales sur `h1-h3`, `.card`, `.badge`, `.btn`, que l'assistant doit neutraliser (`.wz-shell h2, h3`). `.badge` y a une hauteur de 36 px. **Ces classes globales modifient Bootstrap partout : les retirer demande une vérification visuelle.**
- **`!important` :** 105 occurrences, signe de conflits de cascade avec Bootstrap.
- **Libellés en dur** dans le JS et les templates malgré les 5 langues : `theme.js`, `confirm-modal.js`, « Organisation » et « Design System » dans `base.html.twig`. `lang="fr"` est écrit en dur dans 12 templates.
- **Polices :** la pile de `body.app-layout` (`Inter, Roboto`) diffère de `--font-body`. `body` utilise `var(--font-body), serif`.
- **Logique de style dans le JS :** `drawer-manager.js` injecte du HTML avec `style=`, `theme.js` manipule `style.display`.

### 3.4 Bootstrap : moteur temporaire, puis sortie

**Décision :** ne dépendre à terme ni de Bootstrap ni d'aucun framework ([#1](https://github.com/stevenCayla/synapse-design-system/issues/1)). Le retirer d'un coup reste impossible : environ 370 des 2 030 classes de Bootstrap sont utilisées, pour environ 16 000 usages (comptage approximatif sur les attributs de classe).

| Famille | Usages | Traitement |
|---|---|---|
| Utilitaires (`d-flex`, `mb-3`, `text-muted`…) | 10 841 | Mêmes noms, sous-ensemble utilisé copié dans notre code et relié aux jetons. Templates inchangés |
| Grille | 693 | Idem |
| Boutons, formulaires, cartes, badges, alertes, tableaux | Environ 3 700 | Composants `si-*` à nous, renommage mécanique par famille |
| Modales, offcanvas | 260 | `<dialog>` natif, déjà présent dans l'application |
| Collapse, onglets, dropdown | 54, 33, 8 déclencheurs | `<details>`, petits modules, Popover API |

Bootstrap pèse aujourd'hui 232 Ko de CSS et 80 Ko de JS. Le code repris garde sa mention de licence MIT.

**Pendant la migration,** un pont limité relie les jetons aux variables de Bootstrap, pour que les écrans non migrés suivent la marque et le thème. **Piège connu :** changer `--bs-primary` ne suffit pas, `.btn-primary` porte ses propres valeurs compilées ; le pont se fait composant par composant, sans y investir davantage. `data-bs-theme` n'est donc plus un objectif : les composants `si-*` lisent directement les jetons.

### 3.5 Dépendances fortes avec l'application

- Twig : `csp_nonce()`, `app_logo()`, `|trans`, `path()`, `user_timezone()` sont présents dans les partiels. Le Design System ne peut en utiliser aucun : les partiels reçoivent des paramètres déjà traduits.
- JS : API globales (`window.showToast`, `window.confirmModal`, `window.DrawerManager`) appelées depuis les templates. Elles doivent être conservées pendant la migration.
- `LogoExtension` lit un chemin fixe, à mettre à jour.

---

## 4. Éléments à extraire

### 4.1 Classement

| Catégorie | Éléments | Quand |
|---|---|---|
| **Extractible tout de suite** | Polices et licences, logo, jetons, `toast.css/js`, `_toasts`, `si-badge` (base), `si-kpi` et `_kpi_card`, `confirm-modal.js` et `_confirm_modal` (libellés en paramètres) | Phases 2, 5, 6 |
| **Après refactoring** | Bouton (pont Bootstrap et variantes), champs de formulaire et `form_theme`, tableau et barre d'outils (`ul-*`), onglets, alertes, carte, avatar, puce, état vide, chargement, modale, tiroir (`DrawerManager`), coquille (sidebar, en-tête), bouton de thème | Phases 5, 6 |
| **Patterns à documenter** | Formulaires et validation, recherche et filtres, listes CRUD, vide, chargement, erreur, confirmation, action destructive, navigation, authentification, tableaux de bord, assistant multi-étapes | Phase 7 |

### 4.2 Reprise du contenu de `/settings/design`

| Onglet (lignes) | Contenu | Destination | Traitement |
|---|---|---|---|
| Typographie (489-600) | Titres, corps, graisses, couleurs de texte, code | `foundations/typography` | Généré depuis les jetons |
| Couleurs (601-692) | Palette, gris Bootstrap, surfaces, sidebar | `foundations/colors` | Généré depuis les jetons, avec les ratios de contraste |
| Boutons (693-802) | Variantes, tailles, états, icônes, groupes | `components/button` | Repris |
| Toasts (803-939) | Aperçus, démos, récapitulatif | `components/toast` | Repris, démos en fixtures |
| Alertes (940-1056) | Alertes, bannières, notes | `components/alert` | Regroupés en un composant |
| Badges (1057-1312) | Bootstrap, pills, points d'état, chips, `si-badge` | `components/badge`, `components/chip` | Repris |
| | Statuts d'étude, rôles, types de compte, statuts eCRF | `patterns/status-vocabulary` et application | Le Design System fournit les tonalités ; l'application garde la correspondance métier. Cette correspondance est documentée car elle compte en contexte clinique |
| Modales (1313-1403) | Confirmation, tailles, offcanvas | `components/modal`, `components/drawer`, `patterns/confirmation` | Repris |
| Formulaires (1404-1626) | Champs, select, cases, groupes, dépôt, validation | `components/*`, `patterns/forms` | Repris |
| Tableaux (1627-1883) | KPI, barre de filtres, `ul-table` | `components/kpi`, `components/table`, `patterns/crud-lists` | Repris, séparé du vocabulaire utilisateur |
| Layout (1884-2165) | `content-hero`, `people-tabs`, carte d'entité, `ecrf-layout`, sélecteur d'icône | `components/page-header`, `components/tabs`, `components/card`, `patterns/two-column`, `components/icon-picker` | Repris ; sélecteur d'icône à décider selon l'usage |
| Démos et script (2167-fin) | Modales, offcanvas, toasts | Fixtures | Supprimé |

**Ajouts, absents de la page :** assistant, menu latéral, tiroirs, états vide, chargement et erreur, accessibilité, usage et do/don't, versions.

**Condition de retrait** (tout doit être vrai) :

1. `design.synapse-medical.fr` est en production avec un contenu couvrant chaque ligne du tableau.
2. Tu as validé cette couverture.
3. La PR #351 est fusionnée ou abandonnée.

**Le retrait, fait côté `synapse-app`, sur signal (D9) :** supprimer `DesignSystemController.php` et `templates/settings/design/index.html.twig`, le lien de menu sans le remplacer, et le test `_route == 'app_settings_design'` du calcul `_settingsOpen`. Vérifier qu'aucune classe `ds-*` ne subsiste et qu'aucune classe documentée uniquement là ne devienne orpheline. Aucune référence à cette route n'existe dans `tests/` ni `docs/`.

---

## 5. Éléments qui doivent rester dans l'application

| Élément | Raison |
|---|---|
| `ecrf-builder.css/js`, `ecrf-engine.js`, `templates/ecrf/` | Métier. Ils consomment les jetons et remplacent leurs valeurs en dur progressivement |
| Assistant : `study-wizard.js`, écrans de `templates/study/wizard/`, `.wz-*` métier | Métier. Les contrôles rejoignent les composants, le cadre devient un pattern |
| `org-switch`, `session-guard`, `feedback`, `death-checker`, `job-title*`, `therapeutic-area*` | Fonctions Synapse. Seul un combobox générique pourrait sortir |
| `import.css`, `import-flow.js`, `study-sheet.css`, `study-configuration.css` | Écrans métier |
| Correspondance statut, rôle ou type vers tonalité (`_macros/badges`, `regulatory_admin/_status`) | Vocabulaire métier |
| `_environment_banner`, `profile-switcher` | Exploitation et développement |
| `templates/email/`, `templates/emails/` | Le HTML d'e-mail exige des styles en ligne. Plus tard, ils pourront lire `tokens.json` ; hors périmètre v1 |
| `login.css`, `2fa.css` (visuels propres) | Le pattern d'authentification se documente, l'identité reste locale jusqu'à arbitrage |
| Twig `Extension`, traductions | Application |
| CSS local d'écran (`site/new`, `team/index`…) | Styles locaux à ramener vers des fichiers et des jetons, sans les promouvoir |

**Dette à traiter dans l'application, pas à transférer :** 1 260 `style=`, 14 blocs `<style>`, hex dans les templates, `!important`, hérités de `theme.css`, libellés en dur. On n'importe que du CSS revu.

---

## 6. Architecture cible du repository

Une architecture proche de ta proposition, avec trois écarts :

| Écart | Raison |
|---|---|
| **Un seul package** au lieu de `packages/tokens` et `packages/design` | Un seul consommateur aujourd'hui, un seul versionnement, moins de cérémonie. Les sites qui ne veulent que les jetons importent `@synapse-medical/design/tokens.css`. On pourra scinder plus tard sans casser ce point d'entrée |
| **Pas de dossier `examples/`** | Les fixtures vivent avec le composant et deviennent des pages d'exemple du site : une seule copie de chaque exemple |
| **`tooling/` réduit** | Quelques scripts qui répondent chacun à un besoin : validation, audit, synchronisation |

Pile : pnpm 11, Node 24, Astro 7, Starlight 0.42, MDX, Style Dictionary 5, Playwright, axe, Stylelint. Mêmes versions majeures qu'Astro et Starlight dans `synapse-docs`.

---

## 7. Structure détaillée des dossiers

```text
synapse-design-system/
├── README.md
├── AGENTS.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── composer.json                # package synapse/design pour les applications PHP
├── package.json                 # scripts racine
├── pnpm-workspace.yaml
├── .github/workflows/           # ci.yaml, release.yaml
│
├── packages/design/             # @synapse-medical/design
│   ├── package.json             # exports, peerDependencies : bootstrap 5.3
│   ├── tokens/
│   │   ├── primitive/           # color, space, radius, font, shadow, motion, z, breakpoint
│   │   ├── semantic/            # light.tokens.json, dark.tokens.json, base.tokens.json
│   │   └── contrast-pairs.json
│   ├── src/
│   │   ├── foundations/         # reset léger, typographie, fonts.css
│   │   ├── bootstrap/           # pont --si-* vers --bs-*, temporaire (#1)
│   │   ├── utilities/           # sous-ensemble utilisé : flex, marges, texte, grille
│   │   ├── components/
│   │   │   └── badge/
│   │   │       ├── badge.css
│   │   │       ├── badge.html.twig     # si la structure le justifie
│   │   │       ├── badge.js            # si un comportement existe
│   │   │       ├── badge.meta.yaml     # statut, depuis, classes, jetons, règles a11y
│   │   │       └── badge.fixtures.yaml # variantes et états
│   │   └── index.css
│   ├── assets/                  # fonts/ (avec licences OFL), images/logo.svg
│   └── dist/                    # généré, non versionné
│
├── apps/docs/                   # Astro + Starlight, design.synapse-medical.fr
│   ├── astro.config.mjs
│   ├── wrangler.jsonc
│   ├── public/_headers
│   ├── scripts/deploy.sh
│   └── src/
│       ├── content/docs/
│       │   ├── getting-started/  foundations/  components/
│       │   ├── patterns/  accessibility/  content/
│       │   ├── resources/  ai/
│       ├── components/          # Preview, TokenTable, PropsTable, DoDont, ColorSwatch
│       └── pages/
│           ├── index.astro      # page d'accueil conçue
│           └── examples/[...slug].astro # une page autonome par fixture
│
└── tooling/
    ├── validate-tokens.mjs      # alias, parité clair/sombre, contrastes
    ├── validate-docs.mjs        # chaque composant a sa page, ses sections, ses fixtures
    ├── design-audit.mjs         # compteurs de valeurs en dur, livré aussi à l'application
    └── sync-to-app.mjs          # copie locale de dist vers ../synapse-app pour essai
```

---

## 8. Architecture des Design Tokens

### 8.1 Format

JSON au format **DTCG** (`$value`, `$type`), le format du groupe de travail W3C, lu nativement par Style Dictionary 5. Ton exemple écrit `value` ; `$value` a le même rôle et évite d'inventer un format.

Style Dictionary répond à un besoin réel : un CSS par thème, du JSON et du TS à partir d'une source, avec résolution d'alias. Je le préfère à un script maison.

### 8.2 Trois niveaux

```text
primitive     color.indigo.600 = #4f46e5         jamais consommé directement
    ▼
semantic      color.accent.default → indigo.600 (clair) / indigo.400 (sombre)
    ▼
composant     uniquement si un vrai besoin apparaît
```

```json
{
  "color": {
    "text": {
      "muted": { "$type": "color", "$value": "{color.slate.600}" }
    }
  }
}
```

**Thèmes :** `semantic/light.tokens.json` et `semantic/dark.tokens.json`, avec exactement les mêmes clés (contrôlé en CI). Ce format simple suffit tant qu'il n'y a que deux thèmes.

### 8.3 Sorties

| Fichier | Usage |
|---|---|
| `dist/tokens.css` | `:root` et `html[data-theme="dark"]` avec `--si-*` |
| `dist/meta/tokens.json` | Valeurs résolues, description, chemin : agents et outils |
| `dist/tokens.js` et `tokens.d.ts` | Consommateurs JS et sites Astro |
| `dist/aliases.css` | **Temporaire :** `--app-*: var(--si-*)`. Disparaît à la fin de la migration |

### 8.4 Valeurs de départ

Principe : **tirer les jetons de ce que les écrans récents ont déjà validé.**

| Sémantique | Clair | Sombre | Remplace |
|---|---|---|---|
| `color.bg.page` | `#f0f2f8` | `#080d1a` | `--app-bg` |
| `color.surface.default` | `#ffffff` | `#0f1629` | `--app-surface`, `--wz-bg` |
| `color.surface.raised` | `#f7f8fc` | `#141d35` | `--wz-surface`, `--app-surface-2` |
| `color.surface.sunken` | `#eef0f8` | `#1a2440` | `--wz-surface-2`, `--app-surface-3` |
| `color.border.default` | `#e3e6ef` | `rgba(255,255,255,.10)` | `--app-border`, `--wz-border` |
| `color.text.default` | `#1a1d2e` | `#e6ebf5` | `--app-text`, `--wz-text` |
| `color.text.muted` | `#4f566b` | `#b0bacd` | Six variantes |
| `color.accent.default` | `#4f46e5` | `#818cf8` | `--accent`, `--wz-accent`, `--color-brand-*` |
| `color.accent.strong` | `#4338ca` | `#a5b4fc` | `--wz-accent-strong` |
| `color.accent.soft` | `#eeedfd` | `#1e1c44` | `--wz-accent-soft`, `--accent-soft` de `synapse-www` |
| `color.accent.on` | `#ffffff` | `#0f1629` | `--wz-on-accent` |
| `color.success` | `#15803d` | `#4ade80` | `--wz-success` |
| `color.warning` | `#b45309` | `#fbbf24` | `--wz-warning` |
| `color.danger` | `#b91c1c` | `#fca5a5` | `--wz-danger` |

**Contrastes de la marque (D3) :** `#4f46e5` sur blanc 6,29:1 et sur `#f0f2f8` 5,62:1 ; `#4338ca` sur blanc 7,90:1 ; `#818cf8` sur `#0f1629` 6,03:1 ; `#a5b4fc` sur `#0f1629` 9,03:1. En sombre, `#4f46e5` ne convient pas (2,86:1), et le texte sur un bouton `#818cf8` doit être foncé : `#0f1629` donne 6,03:1, le blanc seulement 2,98:1.

Chaque couleur d'état a ses variantes `-soft` et `-line` (reprises de `--cfg-*`). Ajouter un `info`, absent de `--wz-*` mais présent dans la maquette (`#3b82f6`), après contrôle du contraste.

| Échelle | Proposition | Origine |
|---|---|---|
| Espacement | 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 48, 64 | L'échelle actuelle plus 2, 6, 10, très employés |
| Radius | 4, 6, 8, 10, 12, 16, pill | L'usage réel, pas les 12/18/24/32 déclarés |
| Tailles de texte | 12, 13, 14, 16, 18, 20, 24, 30 px, sans passer sous 12 | Réduit les 112 valeurs |
| Points de rupture | Ceux de Bootstrap : 576, 768, 992, 1200, 1400 | Les grilles Bootstrap restent cohérentes. Documentaires : une variable CSS ne peut pas servir dans `@media` |
| Z-index | base, sticky, drawer, modal, toast, overlay | Aligné sur Bootstrap (`1030`, `1050`) |
| Motion | fast .15s, base .22s, avec la courbe existante | `--transition` |

---

## 9. Architecture du package `@synapse-medical/design`

### 9.1 Contenu

```text
@synapse-medical/design
├── dist/synapse-design.css     # foundations, utilitaires, composants, pont Bootstrap temporaire
├── dist/tokens.css             # sans Bootstrap, utilisable seul
├── dist/js/*.js                # modules ESM, sans style ni script en ligne
├── dist/fonts/, images/
├── twig/                       # partiels, namespace @si, avec form_theme
└── meta/                       # tokens.json, components.json, llms-full.txt, AGENTS.consumer.md
```

- **Bootstrap en dépendance pair temporaire,** pas embarqué : l'application garde son entrée d'importmap et le site charge la même version 5.3.8. La dépendance disparaît en Phase 11. Aucun nouveau composant ne s'appuie dessus.
- **Bootstrap Icons** reste chez le consommateur. La documentation présente l'usage et les icônes retenues.
- **Twig :** inclusions `{% include '@si/alert.html.twig' with {...} only %}` et `{% embed %}` quand il y a du contenu libre. Twig standard uniquement, sans bundle Symfony et sans aucune fonction de l'application. Le nonce et les libellés sont passés en paramètres. **Pas de partiel pour un simple bouton :** `<button class="si-btn si-btn--primary">` suffit.
- **JS :** modules sans dépendance de l'application ni de Bootstrap, libellés en paramètres. `window.showToast` et consorts sont conservés par une petite couche de compatibilité.
- **Build :** Style Dictionary pour les jetons, Lightning CSS pour regrouper et minifier. Le CSS source reste natif, BEM et nesting, conforme à la convention existante.
- **Pas de `@layer` en v1 :** une feuille en couche perd contre Bootstrap, qui est hors couche. À reconsidérer quand Bootstrap sera lui aussi importé dans une couche.

### 9.2 Comment l'application consomme le package (D1)

Le code doit se trouver dans l'image de l'application, car Symfony sert ces CSS et JS et rend ces partiels Twig, mais pas dans son dépôt Git. **Décision : une dépendance Composer avec un verrou de version,** comme les autres packages PHP de l'application, téléchargée sans jeton puisque le dépôt est public.

```text
synapse-design-system   workflow de release (version) → CI : build, commit de dist/ hors de main, tag vX.Y.Z
                                                              │
synapse-app             composer require synapse/design  ◄────┘
                        └── vendor/synapse/design/      # non versionné ; composer.lock fixe la version
```

- **Dépôt :** un `composer.json` à la racine. Le `dist/` n'existe que dans le commit tagué, pas sur `main`.
- **Application :** déclaration d'un dépôt `vcs` dans `composer.json`, ajout de `vendor/synapse/design/dist` à `asset_mapper.paths` et de `vendor/synapse/design/twig: si` à `twig.paths`.
- **Dockerfile inchangé :** `composer install` et `asset-map:compile` existent déjà.
- **Nom :** `synapse/design` n'est pas publié sur Packagist, le dépôt `vcs` suffit. Il est indépendant du scope npm du §9.3.
- **Mises à jour :** `composer require`, éventuellement par Dependabot, si sa configuration couvre ce dépôt `vcs` (à vérifier en Phase 4).

**Options écartées :**

| Option | Raison |
|---|---|
| Archive commitée dans l'application | Code généré dans le dépôt, conflits entre branches parallèles à chaque montée de version, pas de Dependabot |
| Composer depuis un dépôt privé | Jeton nécessaire au build Docker, en CI et sur chaque poste |
| `importmap:require` | Passe par jsDelivr et un package npm public, et les partiels Twig ne suivent pas |
| Sous-module Git | Erreurs de synchronisation fréquentes et `dist/` manquant |
| Build Node dans l'application | Contraire à la pile |

L'essai 2 de la Phase 1 valide ce montage avec un vrai build Docker. **Si Composer échoue,** l'archive commitée reste le repli : les templates utilisant `@si/...`, ils ne changeraient pas.

### 9.3 Nom du package

**Décision :** `@synapse-medical/design`, sous l'organisation npm `synapse-medical` créée par Steven le 31/10/2026, cohérente avec le domaine. La mission parlait de `@synapse-medical/design` : c'est le seul écart.

- **Rien à publier pour l'instant :** l'organisation réserve le scope. Le package reste `private` tant qu'aucun consommateur Node ne l'attend. La première publication, pour `www` ou `docs`, demandera un `npm login` ou un jeton en CI.
- **Sites :** `pnpm add @synapse-medical/design`.
- **Application PHP :** le package Composer garde le nom `synapse/design` (§9.2). Il n'est pas publié sur Packagist, et ne dépend donc pas de ce scope.

---

## 10. Architecture Astro/Starlight

- **Reprise de l'existant :** `synapse-docs` a déjà résolu l'intégration Starlight, le thème, `_headers`, le script de déploiement et les scripts en ligne compatibles CSP (`integrations/externalize-inline-scripts.mjs`). On copie ce qui sert, sans dépendance entre dépôts.
- **Arborescence :** `getting-started`, `foundations`, `components`, `patterns`, `accessibility`, `content`, `resources`, `ai`. La section `content` couvre le ton, les libellés et les règles multilingues.
- **Langues (D7) :** anglais à la racine, français sous `/fr/`, avec le système de locales de Starlight. Une page non traduite retombe sur l'anglais et le signale. Les pages générées (jetons, tableaux) ne s'écrivent qu'une fois, leurs libellés sont traduits. `synapse-docs` a le français à la racine : ne pas recopier sa configuration telle quelle. `llms.txt` et les fichiers pour agents sont en anglais seulement.
- **Thème :** `customCss` associe `--sl-*` aux `--si-*`, comme le fait déjà `synapse.css` avec `--sy-*`.
- **Page d'accueil :** `src/pages/index.astro`, hors gabarit Starlight : présentation, accès aux sections, aperçu réel de composants, jetons, numéro de version. `synapse-docs/src/components/home` donne un point de départ technique, pas visuel.
- **« Le site est construit avec le Design System » : limite à connaître.** Le cadre du site utilise les jetons, les polices et les composants `si-*`. Bootstrap n'est pas chargé dans Starlight, car son reset entrerait en conflit avec les styles du site : tant qu'il existe, il reste confiné aux aperçus (§11.2).
- **Pages générées :** couleurs, typographie, espacements à partir de `tokens.json`. Personne n'écrit de valeur à la main.
- **Sécurité :** `_headers` avec une CSP proche de celle de l'application, avec polices et images locales.

---

## 11. Stratégie de documentation des composants

### 11.1 Gabarit de page

Frontmatter validé par un schéma (`status`, `since`, `twig`, `classes`). Sections obligatoires, contrôlées en CI : **Usage, Variantes, États, Dimensions, Accessibilité, Responsive, Exemples, Do / Don't, API.** Toute information s'écrit dans le texte, jamais dans le seul visuel : c'est ce qui rend la page lisible par un agent.

### 11.2 La fixture, pivot du dispositif

```text
badge.fixtures.yaml
        │  rendu
        ├── /examples/badge/success/    page autonome, thème et largeur par paramètre
        │       ├── iframe dans la page MDX, avec son code affiché
        │       ├── test axe (clair et sombre)
        │       └── test visuel Playwright
        └── components.json             exemples pour les agents
```

**L'iframe est choisie pour trois raisons :** elle isole les styles des aperçus de ceux de Starlight, teste vraiment le responsive et permet de changer de thème sans toucher à la page. Aucune capture d'écran n'est nécessaire.

### 11.3 Rendre le vrai Twig dans Astro

| Option | Avantage | Limite |
|---|---|---|
| **Twing** (moteur Twig en JS, 7.3.1, dernière publication en février 2026) | `pnpm dev` sans PHP, vrais partiels | Dépendance à un petit projet, parité à contrôler |
| Rendu PHP à la génération | Fidélité totale | PHP requis pour `pnpm dev`, contraire à l'objectif |
| Refaire le HTML en composants Astro | Simple | **Deux implémentations :** ce que la mission veut éviter |

**Recommandation : Twing, à condition de réussir l'essai de Phase 1,** sur trois composants (badge, alerte, modale). La CI compare en plus les rendus Twing et `twig/twig` en PHP sur toutes les fixtures : le site dira donc vrai sur ce que produit l'application.

**Repli si l'essai échoue :** le PHP rend les fixtures en HTML, commité dans le dépôt comme référence ; la CI en vérifie la dérive ; le site lit ces fichiers sans PHP. Seul le contributeur qui change un partiel a alors besoin de PHP (ou de Docker).

---

## 12. Stratégie IA / AGENTS.md / llms.txt

### 12.1 `AGENTS.md` à la racine

Il pose le principe *Before implementing UI, check the Synapse Design System*, puis :

- **Où trouver :** jetons (`packages/design/tokens/`, sorties dans `meta/tokens.json`), composants (`src/components/*`, `meta/components.json`), patterns (`apps/docs/.../patterns/`).
- **Comment choisir :** arbre de décision reprenant le workflow de contribution (§20).
- **Quand créer un composant :** au moins deux usages hors métier, aucune variante existante ne convient, proposition en PR.
- **Règles à ne jamais contourner :** aucune couleur, aucun espacement, aucune ombre en dur ; aucun jeton primitif dans un composant ; aucun bouton ni variante inventés si une solution existe ; aucun libellé en dur dans un composant ; aucun script ou style en ligne ; contraste AA dans les deux thèmes ; un composant doit avoir ses fixtures et sa documentation.
- **Comment contribuer et vérifier :** commandes à lancer, définition de terminé.

### 12.2 Dans les applications

C'est le point qui rend le dispositif réellement utile : **l'agent trouve dans l'application la documentation de la version qu'elle utilise, sans réseau :**

```text
vendor/synapse/design/meta/
├── AGENTS.consumer.md     # règles pour un projet consommateur
├── components.json
├── tokens.json
└── llms-full.txt
```

`synapse-app/AGENTS.md` reçoit un renvoi court vers ces fichiers.

### 12.3 Formats machine

| Fichier | Rôle | Génération |
|---|---|---|
| `/llms.txt` | Index | `starlight-llms-txt` (0.12, compatible Astro 7 et Starlight 0.41+) |
| `/llms-full.txt` | Toute la documentation | Idem |
| `/tokens.json` | Valeurs résolues, thèmes, description, usage | Style Dictionary |
| `/components.json` | Pour chaque composant : classes, variantes, états, partiel Twig, paramètres, règles a11y, exemples, jetons, statut | Assemblage de `*.meta.yaml` et `*.fixtures.yaml` |

**À vérifier en Phase 3 :** les composants MDX (dont `<Preview>`) doivent ressortir sous forme de texte et de code dans `llms-full.txt`, et pas disparaître. Un test le contrôle.

**Écarté pour l'instant :** un serveur MCP. Les fichiers statiques couvrent le besoin ; à reconsidérer si les agents échouent à trouver l'information malgré eux.

**Mesure d'efficacité, en Phase 8 :** une série de tâches type (« ajoute une liste CRUD ») confiée à un agent. On regarde si le résultat utilise les bons composants et passe les contrôles. C'est le seul moyen de savoir si la documentation fonctionne.

---

## 13. Décision argumentée concernant Storybook

**Décision : ne pas l'ajouter maintenant.**

| Besoin qu'il couvrirait | Couverture sans lui |
|---|---|
| Catalogue | Le site et `/examples/*` |
| Développement isolé | `pnpm dev` et les pages d'exemple, avec rechargement à chaud |
| Tests visuels | Playwright sur ces mêmes pages |
| Accessibilité | axe sur ces mêmes pages |
| Commandes interactives | Non couvert, seul vrai manque |

**Ce qu'il coûterait :** Storybook n'a pas de prise en charge native de Twig. Il faudrait passer par son moteur HTML avec un chargeur Twing, soit un second environnement de build, une seconde manière d'écrire les exemples et un second site, pour un seul développeur et un Design System avant tout en CSS.

**Critères pour le réintroduire,** l'un suffit :

- un composant en framework JS (React, Vue) arrive dans le Design System ;
- plusieurs personnes (designers notamment) ont besoin de manipuler les propriétés sans écrire de code ;
- plus d'une trentaine de composants ont des combinaisons trop nombreuses pour des fixtures.

Il réutiliserait alors les fixtures, et Starlight resterait le portail principal.

---

## 14. Accessibilité

**Référence : WCAG 2.2 niveau AA,** intégré au Design System dès le premier composant.

| Sujet | Règle | Vérification |
|---|---|---|
| Contraste | 4,5:1 pour le texte, 3:1 pour le grand texte et les éléments d'interface, dans les deux thèmes | **Automatique, au niveau jetons :** `contrast-pairs.json` ; axe sur les fixtures |
| Clavier | Tout est utilisable au clavier, ordre logique, pas de piège hors modale | Scénarios Playwright pour les composants interactifs |
| Focus | `:focus-visible` visible avec un jeton dédié, 3:1, jamais masqué. Aujourd'hui, ce style n'existe que dans `2fa`, `study-wizard`, `org-switch`, `login`, `import`, `ecrf-builder` | Fixture d'état, test visuel |
| Modales et tiroirs | Focus piégé puis restauré, Échap, `aria-labelledby` | Scénario Playwright |
| Libellés | Chaque champ a un label, erreurs reliées par `aria-describedby` | axe ; `form_theme` |
| ARIA | HTML natif d'abord, ARIA seulement si nécessaire | Revue, axe |
| États désactivés | Bien lisibles (`--wz-disabled-*` est déjà un bon modèle), pas d'information uniquement par la couleur | Fixture |
| Mouvement | `prefers-reduced-motion` appliqué globalement | Test CSS, Playwright |
| Responsive | Pas de défilement horizontal à 320 px, zoom 200 %, cibles d'au moins 24 px | Tests à plusieurs largeurs |
| Sémantique | Titres en ordre, repères, `lang` correct | axe |

**Sécurité clinique :** un statut ou une alerte n'est jamais exprimé par la seule couleur. Toute modification de tonalité sur les statuts cliniques exige une revue explicite.

**Limite :** les outils automatiques ne détectent qu'une partie des problèmes. Chaque nouveau composant interactif passe aussi un contrôle manuel au clavier et au lecteur d'écran, avec une liste de contrôle sur sa page.

---

## 15. Tests et quality gates

### 15.1 Dans le Design System, progressivement

| Contrôle | Outil | À partir de |
|---|---|---|
| Lint CSS | Stylelint : pas de hex, pas de jeton primitif hors `tokens/` | Phase 1 |
| Lint JS et types | ESLint, `tsc` sur les scripts et le site | Phase 1 |
| Build | `pnpm build` | Phase 1 |
| Jetons | `validate-tokens` : alias, parité clair/sombre, contrastes | Phase 2 |
| Documentation | `validate-docs` : pages, sections, fixtures, liens | Phase 3 |
| Parité Twig | Twing et `twig/twig` sur toutes les fixtures | Phase 3 |
| Accessibilité | `@axe-core/playwright` sur `/examples/*`, deux thèmes | Phase 5 |
| Visuel | Playwright `toHaveScreenshot` sur `/examples/*`, dans une image Docker fixe | Phase 5 |
| Comportement | Playwright sur les composants interactifs | Phase 6 |

### 15.2 Dans les applications : un cliquet, pas un mur

`design-audit.mjs`, livré dans le package, compte par fichier les hex, `rgb()`, `style=`, `!important`, `<style>`, tailles et classes hors catalogue. La référence (`design-audit-baseline.json`) est initialisée avec l'existant.

- **Étape 1 :** rapport seul en CI.
- **Étape 2 :** une PR échoue si un compteur **augmente**. Rien d'existant n'est bloqué.
- **Étape 3 :** les seuils baissent à chaque migration. Quand un écran atteint zéro, il reste à zéro.
- **Duplication de composants :** signalement des classes contenant `btn`, `badge`, `empty`, `chip`, hors liste autorisée.

---

## 16. CI/CD et Cloudflare Pages

Déploiement sur Cloudflare Workers Static Assets (D5), comme `synapse-www` et `synapse-docs`, avec `main` et des tags (D8). Le tag est posé par la CI, car son commit contient les fichiers construits (§9.2).

```text
Pull Request
   ├── lint, typecheck, tests
   ├── validate-tokens, validate-docs, parité Twig
   ├── accessibilité, visuel
   └── build
          ▼
        Revue

main ──► build ──► dev-design.synapse-medical.fr (noindex)

workflow de release, lancé à la main avec la version
           ──► mêmes contrôles
               ├── build, commit de dist/, tag vX.Y.Z + GitHub Release
               └── design.synapse-medical.fr
```

- **Fichiers :** `.github/workflows/ci.yaml` et `release.yaml`, `wrangler.jsonc`, `scripts/deploy.sh` repris de `synapse-docs`.
- **À préparer :** domaines `design.` et `dev-design.synapse-medical.fr`, zone déjà sur Cloudflare ; secrets `CLOUDFLARE_API_TOKEN` et `CLOUDFLARE_ACCOUNT_ID`.
- **Compte :** le dépôt est sous `stevenCayla`, privé et vide à ce jour. Il passe public au début de la Phase 1, avant le premier push, et `main` est alors protégée, comme sur `synapse-docs`.

---

## 17. Versioning et releases

**SemVer, une version unique pour tout le package.** Le contrat public, ce sont les classes, les jetons sémantiques, les paramètres des partiels et les API JS.

| Type | Exemple |
|---|---|
| **Majeure** | Suppression ou renommage de classe, de jeton ou de paramètre ; montée majeure de Bootstrap |
| **Mineure** | Nouveau composant, variante ou jeton ; dépréciation |
| **Correctif** | Correction sans changement de contrat. **Un changement de valeur visible (contraste, par exemple) est au moins mineur** et s'accompagne d'une note avec avant/après |

- **`0.x` pendant la migration,** où une mineure peut encore casser (ce sera noté). **`1.0.0` à la fin de la Phase 10.**
- **Sortie de Bootstrap :** une version majeure avec note de migration ([#1](https://github.com/stevenCayla/synapse-design-system/issues/1)).
- **Dépréciation :** classe ou jeton marqué dans `components.json`, signalé par l'audit, retiré à la majeure suivante.
- **`CHANGELOG.md` écrit à la main, contrôlé en CI.** Pas de Changesets : pour un package et un seul mainteneur, il ajouterait une étape sans bénéfice. À reconsidérer s'il y a plusieurs packages.
- **Application :** chaque montée de version est une PR séparée de `synapse-app`, avec les écarts visuels.

---

## 18. Stratégie de migration de l'application actuelle

### 18.1 Principes

1. **Pas de big bang :** une PR par famille, chacune réversible en revenant à la version précédente.
2. **Séparer strictement** « changement de structure, sans écart visuel » et « changement voulu, avec captures ».
3. **L'application fonctionne à chaque étape.**
4. **Pas de réécriture massive :** les utilitaires gardent leurs noms ; les composants sont renommés mécaniquement, une famille à la fois, à partir de l'étape 4.
5. **Une application clinique ne change pas sans le dire :** chaque écart visuel figure dans les notes de version.

### 18.2 Référence visuelle, préalable à tout

Avant toute modification, dans `synapse-app/tests/e2e/` : un scénario de captures, sur données de démonstration figées, à 2 thèmes et 2 largeurs, sur une vingtaine d'écrans (connexion, 2FA, accueil, étude, configuration, assistant, patients, saisie eCRF, builder, utilisateurs, équipe, centres, paramètres, tiroir de notifications, changement d'organisation, toasts). Jamais de données réelles dans les captures. Exécution dans une image Docker fixe, pour la stabilité du rendu.

### 18.3 Ordre et détail

| Étape | Risques | Dépendances | Changements dans l'application | Anti-régression |
|---|---|---|---|---|
| **1. Foundations** (polices, logo) | Chemins, CSP, sous-ensemble de caractères | Archive et chemins AssetMapper | `fonts.css` remplacé, chemin de `LogoExtension` | Captures identiques |
| **2. Tokens** | Cascade, spécificité du sombre | Étape 1 | Chargement de `tokens.css` et `aliases.css` ; retrait des déclarations de `theme.css` et d'`app.css` ; puis `--wz-*`, `--im-*`, `--sheet-*`, `--os-*`, `--cfg-*` en alias, un fichier par PR. **Valeurs actuelles conservées** | Captures identiques, sinon on s'arrête |
| **2 bis. Corrections de contraste** | Changement visible | Étape 2 | Une release qui change les valeurs sémantiques, sans toucher aux templates | Écarts voulus, listés, relus |
| **2 ter. Changement de marque (D3)** | **Coexistence de deux couleurs** si le passage se fait avant le retrait des valeurs en dur ; données stockées | Étape 2 | D'abord remplacer par des jetons `#6d4aff` (82 dans les CSS, 131 dans les templates), `rgba(109,74,255,…)` (79 dans les CSS) et les autres violets ou indigos ; puis basculer le jeton et `logo.svg`. **À examiner à part :** `TeamAccentColor`, `Team`, `EcrfSpecialty`, `TeamController`, `StudyWizardController`, qui contiennent cette valeur en PHP : les couleurs déjà enregistrées pour des équipes ou des spécialités ne changent pas sans décision. E-mails à traiter séparément | Captures relues, écart voulu et annoncé dans les notes de version |
| **3. Styles globaux** | **Le plus risqué :** `.card`, `.badge`, `.btn`, `h1-h3` modifient tout | Étape 2 | Pont Bootstrap limité ; utilitaires et grille copiés dans le Design System ; retrait des hérités de `theme.css` ; retrait des `!important` devenus inutiles | Écran par écran, deux thèmes |
| **4. Composants simples** (bouton, badge, alerte, carte, champs, KPI, avatar, puce, état vide, chargement) | Variantes oubliées, classes locales restantes | Étape 3 | Composants `si-*` sans Bootstrap ; renommage mécanique famille par famille (`.btn`, `wz-btn`, `im-btn`…) ; `form_theme` progressif | Captures, e2e, cliquet |
| **5. Composants complexes** (toast, confirmation, modale, tiroir, onglets, tableau, coquille) | Focus, API globales, conflits avec `base.html.twig` | Étape 4, PR #351 | Modules DS, couche `window.*` conservée ; `<dialog>` natif pour modales et tiroirs ; `data-bs-*` remplacés | e2e, clavier, axe |
| **6. Patterns** | Sur-généralisation | Étape 5 | Documenter d'abord ; remplacer `style=` et `<style>` à l'occasion des évolutions d'écrans | Cliquet |

### 18.4 Gestion des PR ouvertes

Le plan n'impose aucun gel. Fusionner les PR à leur rythme. Une PR fusionnée après l'étape 2 ajoute simplement une famille à aliaser (`--cfg-*`). Seule contrainte : le retrait de `/settings/design` attend le sort de #351.

### 18.5 Consommation par les autres applications

`synapse-www` et `synapse-docs` ne sont pas concernés avant la 1.0. Ils utilisent déjà `#4f46e5` (D3) : la convergence se limitera à importer `tokens.css` et à faire de leurs variables des alias.

---

## 19. Risques techniques

| Risque | Probabilité | Impact | Réponse |
|---|---|---|---|
| Twing et Twig PHP divergent, ou Twing cesse d'être maintenu | Moyenne | Moyen | Test de parité en CI ; repli défini au §11.3 |
| Régression visuelle à cause de `theme.css` et des `!important` | **Élevée** | Élevé | Référence de captures, PR par famille, deux thèmes |
| Captures instables (polices, dates, animations) | Élevée | Moyen | Docker fixe, données figées, animations coupées, masques |
| Sortie de Bootstrap interminable : deux systèmes qui coexistent | **Élevée** | Moyen | Aucun nouveau composant dessus, compteurs à zéro en CI, utilitaires gardés sans réécriture |
| Comportements perdus en quittant le JS de Bootstrap (focus, Échap, lecteur d'écran) | Moyenne | **Élevé** | Scénarios clavier écrits avant le remplacement ; `<dialog>` natif ; tests d'accessibilité |
| Écart de lecture sur un statut clinique après changement de couleur | Faible | **Élevé** | Revue explicite ; jamais la couleur seule |
| Dette transférée au Design System | Moyenne | Élevé | N'importer que du CSS revu ; règle de contribution |
| Migration inachevée laissant les alias et l'ancien code en place | **Élevée** | Moyen | Cliquet, compteurs publics, retrait d'alias suivi par famille |
| Conflits avec le travail produit en cours | Élevée | Moyen | PR courtes et ciblées ; aucun gel |
| Changement de marque partiel : deux couleurs visibles dans l'application | Moyenne | Moyen | Retirer les valeurs en dur avant de basculer le jeton (étape 2 ter) |
| Coût de la documentation pour une seule personne | Moyenne | Moyen | Pages générées autant que possible, gabarit court, priorité aux composants réellement utilisés |
| Version en retard dans l'application | Moyenne | Faible | Dependabot, ou alerte en CI si sa configuration ne couvre pas ce dépôt |

---

## 20. Plan d'implémentation par phases

Tailles relatives (S, M, L) : ce sont des estimations, pas des engagements. J'ai modifié ton découpage sur deux points :

- **L'application consomme les jetons dès la Phase 4,** avant les composants. Cette étape sans écart visuel confronte tôt le mode de livraison à la réalité.
- **Les composants complexes ont leur propre phase,** car ce sont eux qui ont du comportement, et leur fin ouvre le retrait de `/settings/design`.

### Phase 0 : Audit (ce document), S

- **Objectif :** valider le périmètre et les décisions.
- **Tâches :** relire ; valider le plan.
- **Fichiers :** `DESIGN_SYSTEM_EXTRACTION_PLAN.md`.
- **Dépendances :** aucune.
- **Risques :** audit par comptage, sans contrôle dans le navigateur ; PR en cours.
- **Critères d'acceptation :** plan validé par toi, décisions consignées.

### Phase 1 : Repository, outillage et essais, M

- **Objectif :** `git clone`, `pnpm install`, `pnpm dev` fonctionnent, et les trois incertitudes techniques sont levées.
- **Tâches :**
  - Dépôt public, protection de `main`.
  - Workspace pnpm, Node 24, Starlight minimal, CI (lint, build).
  - `README.md`, `AGENTS.md` initial, `CONTRIBUTING.md`, `CHANGELOG.md`.
  - **Essai 1 :** rendre badge, alerte et modale en Twing, dans une iframe, et comparer avec Twig PHP.
  - **Essai 2 :** sur une branche jetable de l'application, installer le package avec Composer, déclarer les chemins, faire tourner `asset-map:compile` et le build Docker.
  - **Essai 3 :** réserver le nom npm (§9.3, à faire par toi).
- **Fichiers :** racine, `apps/docs/`, `packages/design/package.json`, `.github/workflows/ci.yaml`.
- **Dépendances :** Phase 0.
- **Risques :** Twing inadapté (repli prêt).
- **Critères d'acceptation :** les trois commandes fonctionnent sur un clone neuf ; CI verte ; rendus Twing et PHP équivalents sur les trois composants, ou repli choisi ; nom figé ; aucune fusion dans `synapse-app`.

```text
pnpm dev         site et rechargement à chaud       pnpm test        unitaires, parité Twig
pnpm build       package et site                    pnpm test:a11y   axe sur les fixtures
pnpm lint        Stylelint, ESLint                  pnpm test:visual captures Playwright
pnpm typecheck   tsc                                pnpm tokens      génère les jetons
pnpm validate    jetons et documentation            pnpm sync:app    copie vers ../synapse-app (essai)
```

**Résultats (31/10/2026) :**

- **Essai 1, réussi :** les 10 fixtures de badge, alerte et modale sont identiques entre Twing 7.3.1 et Twig 3.30 (la version de l'application), en `include` et en `embed`. Le comparateur détecte bien un écart : `{{ 1/3 }}` diffère entre les deux moteurs, d'où la règle interdisant l'arithmétique dans les partiels.
- **Essai 2, réussi :** sur une branche jetable, l'image de production de l'application se construit sans jeton avec `synapse/design` installé par Composer. `asset-map:compile` publie le CSS, et le vrai kernel en production rend `@si/badge.html.twig` et `@si/modal.html.twig`.
- **Essai 3, réussi :** organisation npm `synapse-medical` créée (§9.3).
- **Appris :** `&--modifier` n'existe qu'en Sass et le CSS natif ignore la règle. Les sélecteurs BEM s'écrivent en entier, et Stylelint interdit l'autre forme.

### Phase 2 : Foundations et tokens, M

- **Objectif :** source unique des valeurs, sans rien changer à l'écran.
- **Tâches :** primitives et sémantiques (§8.4) ; polices et licences OFL, logo ; générer CSS, JSON, TS ; `validate-tokens` ; table de correspondance entre anciennes variables et jetons ; `aliases.css` avec **les valeurs actuelles**, plus une liste des valeurs cibles pour l'étape 2 bis.
- **Fichiers :** `packages/design/tokens/**`, `assets/**`, `tooling/validate-tokens.mjs`.
- **Dépendances :** Phase 1.
- **Risques :** une variable oubliée ; deux variables de même nom mais de valeurs différentes.
- **Critères d'acceptation :** toutes les variables de l'application et des PR ont leur correspondance ; parité clair/sombre vérifiée ; contrastes cibles passant le seuil.

### Phase 3 : Site Astro/Starlight, M

- **Objectif :** site réel sur `dev-design.synapse-medical.fr`, couvrant les foundations.
- **Tâches :** page d'accueil conçue ; thème ; `Preview`, `TokenTable`, `DoDont` ; pages de foundations générées ; `getting-started` en anglais et en français ; déploiement ; `llms.txt` et `tokens.json`.
- **Fichiers :** `apps/docs/**`, `.github/workflows/ci.yaml`.
- **Dépendances :** Phase 2.
- **Risques :** thème Starlight trop contraint pour l'accueil, résolu par une page hors gabarit.
- **Critères d'acceptation :** déploiement automatique de la préproduction ; pré-production `noindex` ; onglets Typographie et Couleurs de la page design couverts ; aperçus sans capture d'écran ; aucune erreur CSP.

### Phase 4 : Première consommation par l'application, M

- **Objectif :** étapes 1 et 2 du §18.3.
- **Tâches, dans `synapse-app` sur ton signal :** référence de captures (§18.2) ; installation du package avec Composer ; chemins AssetMapper et Twig ; polices et logo ; `tokens.css` et alias ; une PR par famille de variables ; premier cliquet en mode rapport.
- **Fichiers :** `composer.json`, `composer.lock`, `config/packages/{asset_mapper,twig}.yaml`, `assets/app.js`, `assets/styles/{theme,app,study-wizard,import,study-sheet,org-switch}.css`, `.github/workflows/ci.yaml`, `tests/e2e/`.
- **Dépendances :** Phases 2 et 3 ; session `synapse-app`.
- **Risques :** ordre de cascade ; dérive des captures.
- **Critères d'acceptation :** captures identiques ; build de production et e2e verts ; plus aucune déclaration de valeur pour ces familles hors du Design System.

### Phase 5 : Composants de base, L

- **Objectif :** styles globaux assainis et composants simples.
- **Tâches :** corrections de contraste (2 bis) ; changement de marque (2 ter) ; pont Bootstrap limité ; utilitaires et grille copiés ; retrait des hérités ; composants `si-*` sans Bootstrap : bouton, champs et `form_theme`, badge, alerte, carte, KPI, avatar, puce, état vide, chargement, pagination ; tests axe et visuels ; pages de documentation ; remplacement famille par famille.
- **Fichiers :** `packages/design/src/{bootstrap,components}/**`, `apps/docs/.../components/*`, `theme.css`, `buttons.css`, `badges.css`, et les templates concernés.
- **Dépendances :** Phase 4.
- **Risques :** les styles globaux, plus haut risque du plan (§19). `form_theme` : 25 formulaires touchés.
- **Critères d'acceptation :** chaque composant a sa page complète, ses fixtures, axe sans erreur dans les deux thèmes ; `theme.css` ne contient plus d'héritage ; écarts visuels tous relus ; cliquet actif en blocage.

### Phase 6 : Composants complexes et page design, L

- **Objectif :** composants à comportement, puis retrait de `/settings/design`.
- **Tâches :** toast, confirmation, modale et tiroir en `<dialog>` natif avec `DrawerManager` adapté, onglets, tableau et barre d'outils, coquille d'application, bouton de thème ; libellés en paramètres et traduits dans les 5 langues ; première mise en production du site en `0.x` ; vérifier la couverture du §4.2, puis **donner le signal de retrait à la session `synapse-app`.**
- **Fichiers :** `src/components/**`, `assets/js/{toast,confirm-modal,drawer-manager,theme,sidebar}.js`, `templates/components/*`, `base.html.twig`, `base_frame.html.twig`, `DesignSystemController.php`, `templates/settings/design/index.html.twig`.
- **Dépendances :** Phase 5, PR #351 et correctif du bouton de thème.
- **Risques :** focus et API globales ; scripts inline Twig qui appellent `window.*`.
- **Critères d'acceptation :** scénarios clavier verts ; e2e verts ; condition de retrait (§4.2) remplie et validée par toi ; page et lien retirés.

### Phase 7 : Patterns, M

- **Objectif :** documenter les assemblages à partir d'écrans réels.
- **Tâches :** formulaires et validation, recherche et filtres, listes CRUD, vide, chargement, erreur, confirmation, action destructive, navigation, authentification, tableaux de bord, assistant multi-étapes, vocabulaire de statuts.
- **Fichiers :** `apps/docs/.../patterns/*`, éventuels partiels.
- **Dépendances :** Phases 5 et 6.
- **Risques :** sur-généralisation ; ne documenter que des patterns observés au moins deux fois.
- **Critères d'acceptation :** chaque pattern cite un écran réel, ses composants, ses règles et ses limites ; aucun nouveau composant sans justification.

### Phase 8 : Intégration agents, S

`AGENTS.md`, `llms.txt` et `tokens.json` existent dès les Phases 1 et 3 ; cette phase les complète.

- **Objectif :** un agent choisit le bon composant sans aide.
- **Tâches :** `components.json` complet ; `AGENTS.consumer.md` ; `meta/` dans le package ; renvoi dans `synapse-app/AGENTS.md` ; section `ai` du site ; tâches de mesure (§12.3).
- **Fichiers :** `AGENTS.md`, `tooling/`, `apps/docs/.../ai/*`.
- **Dépendances :** Phases 5 et 6.
- **Risques :** documentation agent et humaine qui divergent : générer la première depuis la seconde.
- **Critères d'acceptation :** tâches de mesure réussies sans valeur inventée ; `llms-full.txt` contient les exemples ; aucune mention d'auteur.

### Phase 9 : Qualité et automatisation, S à M

- **Objectif :** verrouiller les acquis.
- **Tâches :** audit axe sur les écrans de l'application, plan de correction ; baisse des seuils du cliquet ; alerte de version en retard ; contrôle manuel au lecteur d'écran ; suppression d'alias quand une famille est migrée.
- **Fichiers :** `tooling/design-audit.mjs`, `synapse-app/.github/workflows/ci.yaml`, baseline.
- **Dépendances :** Phases 5 et 6.
- **Risques :** faux positifs qui découragent le cliquet ; garder les règles simples.
- **Critères d'acceptation :** axe sans erreur critique ou sérieuse sur les écrans de la référence ; compteurs en baisse et publiés.

### Phase 10 : Release 1.0, S

- **Objectif :** référence officielle pour toute nouvelle interface Synapse.
- **Tâches :** revue du contrat public ; retrait de ce qui est déprécié ; tag `v1.0.0` ; publication du package si un consommateur Node existe ; alignement de `www` et `docs` sur les jetons ; décision sur la police de titres ; indexation du site.
- **Fichiers :** `CHANGELOG.md`, `package.json`, `README.md`.
- **Dépendances :** Phases 6 à 9.
- **Risques :** figer un contrat trop tôt : ne promettre que ce qui est documenté et utilisé.
- **Critères d'acceptation :** l'application consomme la 1.0 en production ; `design.synapse-medical.fr` à jour ; plus d'alias sur les écrans migrés et liste écrite de ce qui reste ; politique de contribution appliquée.

### Phase 11 : Sortie de Bootstrap ([#1](https://github.com/stevenCayla/synapse-design-system/issues/1)), L

Elle ne bloque pas la 1.0, mais les Phases 5 et 6 la préparent : aucun nouveau composant ne dépend de Bootstrap.

- **Objectif :** ne plus dépendre d'aucun framework UI.
- **Tâches :** terminer les familles restantes ; remplacer les derniers `data-bs-*` et appels `bootstrap.*` ; supprimer le pont et le CSS et JS de Bootstrap ; décider du sort de Bootstrap Icons (292 icônes utilisées : bibliothèque conservée, ou sprite SVG à nous) ; contrôle CI interdisant tout retour.
- **Fichiers :** `importmap.php`, `assets/lib/bootstrap/`, `base.html.twig`, `base_frame.html.twig`, `packages/design/src/bootstrap/`, `packages/design/package.json`.
- **Dépendances :** Phases 5 et 6.
- **Risques :** accessibilité des comportements remplacés ; effet du reset de Bootstrap sur les styles locaux, visible seulement à son retrait.
- **Critères d'acceptation :** ceux de l'issue #1 ; version majeure publiée.

### Workflow de contribution

```text
Besoin d'interface
   │
   ▼
Un composant ou un pattern existe ?
   ├── OUI → réutiliser
   └── NON
        ▼
   Variante d'un existant ? ── OUI → PR de variante, si le besoin est récurrent
        │ NON
        ▼
   Propre à l'application ?
        ├── OUI → garder dans l'application, avec les jetons
        └── NON
             ▼
   Deux usages ou plus, réels ou proches ?
        ├── NON → garder dans l'application, à réexaminer au deuxième usage
        └── OUI
             ▼
   Proposition, PR : CSS, fixtures, documentation, a11y
             ▼
   Revue → nouvelle version → montée dans l'application
```

Le Design System n'a pas vocation à recevoir tous les composants de toutes les applications : le critère des deux usages sert à le garder petit.

---

## Principes appliqués

Dans l'ordre que tu as demandé : **simplicité** (un package, pas de Storybook, pas de registre npm imposé à l'application, pas de Changesets), **source unique** (jetons, fixtures, partiels), **réutilisabilité** (`tokens.css` utilisable seul), **accessibilité** (contrastes au niveau des jetons), **expérience développeur** (`pnpm dev` sans PHP), **agents** (`meta/` versionné dans chaque application), **performances**, **maintenabilité** (cliquet, retrait des alias).

**Dépendance retirée à terme :** Bootstrap (Phase 11).

**Dépendances ajoutées et leur besoin :** Astro, Starlight, MDX (site) ; Style Dictionary (jetons) ; Lightning CSS (regroupement CSS) ; Twing (rendu Twig, sous réserve de l'essai) ; `starlight-llms-txt` (`llms.txt`) ; Playwright et axe (visuel et accessibilité) ; Stylelint, ESLint (lint). Rien d'autre.
