# 🔎 Visão geral do sistema

```
└── 📁Locked
    └── 📁.github
        └── 📁workflows
            ├── update-guild.yaml
    └── 📁src
        └── 📁css
            └── 📁base
                ├── base.css
                ├── reset.css
                ├── typography.css
            └── 📁components
                ├── buttons.css
                ├── cards.css
                ├── forms.css
                ├── gallery.css
                ├── lightbox.css
                ├── table.css
            └── 📁layout
                ├── footer.css
                ├── header.css
                ├── nav.css
                ├── section.css
            └── 📁pages
                ├── home.css
            └── 📁responsive
                ├── breakpoints.css
            └── 📁utilities
                ├── animations.css
                ├── effects.css
                ├── helpers.css
                ├── scrollbar.css
            ├── main.css
        └── 📁data
            ├── gallery.json
            ├── members.json
        └── 📁js
            ├── gallery.js
            ├── members.js
            ├── navigation.js
            ├── particles.js
        └── 📁screenshots
            ├── brainhead-boss.jpeg
            ├── yalahar-quest.jpeg
        └── 📁scripts
            ├── generate-gallery.js
            ├── scraper.js
        ├── darashia.png
        ├── edron.png
        ├── logo.png
        ├── porthope.png
    ├── CNAME
    ├── index.html
    ├── package.json
    ├── README.md
    └── STRUCTURE.MD
```

## Stack

1. Frontend estático (HTML + CSS + JS puro) SPA like
2. Dados em:
   1. members.json
   2. gallery.json
3. Scripts auxiliares:
   1. scraper.js
   2. generate-gallery.js
4. Automação:
   1. GitHub Actions (update-guild.yaml)

## Arquitetura implícita

Static Site + Data-driven via JSON + automação externa

## DevOPS

1. Hospegagem em Github pages
2. CDN via CloudFlare
3. Domínio https://www.guildlocked.com.br

## ESPECIFICAÇÃO DE REQUISITOS

1. Requisitos Funcionais

### RF-01 — Exibição de membros

O sistema deve carregar e renderizar dados de members.json

Deve exibir:

- Nome
- Level
- Vocação

Deve permitir ordenação via filtros de Lvl e Vocação

### RF-02 — Galeria da guild (screeshots)

O sistema deve carregar gallery.json

Deve renderizar imagens com:
título

- Deve suportar expansão (lightbox)

### RF-03 — Navegação entre seções

Sistema SPA-like via navigation.js

Deve alternar entre:

- Home
- Members
- Gallery

### RF-04 — Atualização automatizada de dados

Pipeline via GitHub Actions deve:

- Rodar scraper (scraper.js)
- Atualizar JSONs
- Commitar automaticamente

### RF-05 — Identidade visual da guild

Uso de assets:

- mapa (Darashia, Edron, Port Hope)
- screenshots
- logo

## Requisitos Não Funcionais

### RNF-01 — Zero backend

Todo processamento deve ocorrer:

- no client
- ou via CI (GitHub Actions)

### RNF-02 — Performance

- Tempo de carregamento < 2s
- Assets devem ser cacheáveis via Cloudflare

### RNF-03 — Compatibilidade

- Responsivo (responsive.css) Mobile First
- Funcionar em desktop + mobile

### RNF-04 — Manutenibilidade

- Dados separados de UI
- Scripts reutilizáveis

### RNF-05 — SEO básico

- HTML indexável
- Dados estruturados

## Próximos passos

1. Criar estrutura de variáveis para cores (design tokens), e aplicar a mudança em todos os arquivos onde continham cores hardcoded, inclusive no index.html
2. Substituir no html a atual chamada de CSS pelos novos arquivos criados.
3. Modernizar o CSS e alfabetizar o mesmo, seguindo os padrões de stylelint.
4. Modernizar o JS ativando ES Modules e migrando a estrutura atual sem alterar seu funcionamento.
5. Substituir no HTML as chamadas dos antigos JS pelos novos e mordenizar os códigos inline existentes para atender as mudanças aplicadas.
6. Modernizar o JS aplicando as regras de ESLint e melhorando a estrutura existente para obter mais performance e atender conceitos como INP.
