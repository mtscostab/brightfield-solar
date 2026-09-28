# Brightfield Solar: páginas de cidade

Landing page de conversão para **Phoenix, AZ**, construída como o primeiro de cerca de 120 templates de cidade.
Next.js 16 (App Router), TypeScript estrito, CSS Modules, sem banco de dados e sem serviços externos obrigatórios.

- Rota: `/solar/phoenix-az`. A raiz `/` redireciona para ela e mantém a query string (UTMs incluídas).
- A página é 100% estática (SSG). O único trecho dinâmico é `POST /api/analytics`.
- Todo valor que muda por cidade está em `src/content/cities/phoenix-az.ts`.

---

## 1. Como instalar e rodar

Requisitos: **Node.js ≥ 20.9** e npm.

```bash
npm install
npm run dev          # http://localhost:3000 → redireciona para /solar/phoenix-az
```

| Script              | O que faz                                                          |
| ------------------- | ------------------------------------------------------------------ |
| `npm run dev`       | Servidor de desenvolvimento (Turbopack)                            |
| `npm run build`     | Build de produção, com pré-renderização estática das cidades       |
| `npm start`         | Serve o build de produção                                          |
| `npm run lint`      | ESLint (`eslint-config-next`: core-web-vitals + TypeScript)        |
| `npm test`          | Vitest: fórmula, cenários de aceite, analytics e validação de dados |
| `npm run typecheck` | Gera os tipos de rota (`next typegen`) e roda `tsc --noEmit`       |

Para testar atribuição, abra:
`http://localhost:3000/?utm_source=google&utm_medium=cpc&utm_campaign=phx_solar`.
Os eventos aparecem no terminal do `npm run dev` como uma linha JSON `{"type":"analytics",...}` e, em dev, também no console do navegador.

---

## 2. Arquitetura

```txt
src/
  app/
    layout.tsx                    fontes locais, metadataBase, <html lang="en-US">
    globals.css                   design tokens (cores, tipografia, espaçamento) e utilitários
    solar/[city]/
      page.tsx                    generateStaticParams + generateMetadata, dynamicParams = false
      opengraph-image.tsx         imagem de preview para links, gerada no build para cada cidade
    components/
      CityLandingPage.tsx         o TEMPLATE: monta as seis seções na ordem pedida
      Hero.tsx / HeroArt.tsx      proposta de valor e composição SVG (sol, telhado, painéis)
      SimulatorSection.tsx        (server) cabeçalho da seção; passa ao client só os dados necessários
      Simulator.tsx               (client) sliders, perfis, resultado e sincronização com a URL
      Process.tsx                 três etapas
      SocialProof.tsx             depoimentos e equipes
      Faq.tsx                     <details>/<summary>
      FinalCta.tsx                ligação e compartilhamento
      ShareButton.tsx             (client) Web Share API, com fallback para a área de transferência
      Analytics.tsx               (client) captura UTMs e um listener delegado para cta_clicked
      JsonLd.tsx                  schema.org HomeAndConstructionBusiness + FAQPage
      SiteHeader / SiteFooter / MobileCtaBar / BrandMark
    api/analytics/route.ts        coletor local: valida e registra o evento, responde 202
    sitemap.ts / robots.ts / not-found.tsx / icon.svg
  content/cities/
    types.ts                      contrato CityContent
    phoenix-az.ts                 dados de Phoenix (fonte de verdade) + FAQs derivadas deles
    index.ts                      registro: getAllCities(), getCityBySlug()
    cities.test.ts                validação de qualquer arquivo de cidade
  lib/
    solar.ts                      função pura estimateSolar() e domínio dos sliders
    solar.test.ts                 cenários de aceite e casos de borda
    format.ts                     formatação en-US (moeda, kWh, datas em UTC)
    site.ts                       URL canônica, helpers de rota e tel:
    analytics/
      events.ts                   contrato dos eventos + guard de runtime (usado pela API)
      attribution.ts              UTMs: leitura da URL e persistência na sessão
      client.ts                   track() + transports plugáveis
  fonts/                          Fraunces e Instrument Sans (OFL), auto-hospedadas
```

### Separação entre template e dados

`CityLandingPage` recebe um `CityContent` e não tem nenhum valor de cidade escrito no código. Um
`grep` por "Phoenix", "Arizona" ou "602" em `src/app` e `src/lib` só encontra comentários. O único
ponto que aponta para Phoenix é o redirect de `/` em `next.config.ts`.

**Para adicionar uma cidade:**

1. copie `phoenix-az.ts` para `tucson-az.ts` (por exemplo) e troque os valores;
2. registre o arquivo no array de `src/content/cities/index.ts`.

Rota estática, metadata, sitemap, JSON-LD e imagem Open Graph passam a existir automaticamente. O
`cities.test.ts` roda sobre todas as cidades registradas e falha o CI se um arquivo vier malformado
(por exemplo, slug inválido, perfil fora do slider ou datas inválidas).

As FAQs de Phoenix são montadas com os mesmos valores do arquivo e com a própria `estimateSolar()`,
então um número na FAQ nunca diverge do simulador.

### Server × Client Components

| Client Component | Por quê                                                                         |
| ---------------- | ------------------------------------------------------------------------------- |
| `Simulator`      | estado dos sliders e perfis, cálculo em tempo real, sincronização com a URL     |
| `ShareButton`    | `navigator.share` e `navigator.clipboard`                                       |
| `Analytics`      | `sessionStorage` e o listener de clique delegado                                |

Todo o resto é Server Component. Os CTAs de hero, header, FAQ e rodapé continuam no servidor porque o
rastreamento usa só `data-cta` e `data-cta-location`, lidos por um único listener em `Analytics.tsx`.

---

## 3. A fórmula

Implementada em `src/lib/solar.ts` → `estimateSolar(inputs, assumptions)`. É uma função pura, sem
React e sem DOM. Retorna o resultado final, os valores intermediários (usados no "Show the math") e
duas flags de transparência.

```txt
consumoMensalKwh        = contaMensal / tarifa
consumoACobrir          = consumoMensalKwh × (cobertura / 100)
geracaoMensalPorPainel  = (wattsPainel / 1000) × horasSolPico × 30 × fatorDesempenho
painéisSolicitados      = ceil(consumoACobrir / geracaoMensalPorPainel)
painéis                 = max(painéisSolicitados, mínimoDePainéis)
investimentoApósCrédito = painéis × wattsPainel × custoPorWatt × (1 − créditoFederal)
geracaoMensalTotal      = painéis × geracaoMensalPorPainel
economiaSemTeto         = geracaoMensalTotal × tarifa
economiaMensal          = min(economiaSemTeto, contaMensal)
paybackAnos             = investimentoApósCrédito / (economiaMensal × 12)
```

**Exemplo (padrão de Phoenix: US$ 220, 80%)**

| Passo                       | Conta                              | Resultado        |
| --------------------------- | ---------------------------------- | ---------------- |
| Consumo                     | 220 / 0,15                         | 1.466,67 kWh     |
| A cobrir                    | 1.466,67 × 0,80                    | 1.173,33 kWh     |
| Geração por painel          | 0,45 × 6,5 × 30 × 0,8              | 70,2 kWh         |
| Painéis                     | ceil(16,71), mínimo 8              | **17**           |
| Investimento                | 17 × 450 × 2,75 × 0,7              | **US$ 14.726,25** |
| Geração total               | 17 × 70,2                          | 1.193,4 kWh      |
| Economia                    | min(1.193,4 × 0,15; 220)           | **US$ 179,01**   |
| Payback                     | 14.726,25 / (179,01 × 12)          | **6,9 anos**     |

**Detalhes de precisão**

- O `ceil` usa um epsilon de `1e-9`. Um valor que é inteiro na matemática pode sair do ponto flutuante
  como `93.00000000000001`, e o `ceil` puro somaria um painel a mais. Existe um teste específico para
  esse caso.
- A função trabalha com valores sem arredondamento. O arredondamento acontece só na exibição:
  centavos para dinheiro e uma casa decimal para o payback.
- Entradas inválidas (zero, NaN, cobertura acima de 100%, `minPanels` que não é inteiro) lançam
  `RangeError` em vez de devolver `NaN`.
- **O incentivo estadual nunca entra no cálculo.** Ele aparece apenas como nota informativa.

**Cenários de aceite** (todos em `solar.test.ts`)

| Conta   | Cobertura | Painéis | Investimento  | Economia   | Payback | Avisos            |
| ------- | --------: | ------: | ------------: | ---------: | ------: | ----------------- |
| US$ 220 | 80%       | 17      | US$ 14.726,25 | US$ 179,01 | 6,9     | nenhum            |
| US$ 430 | 80%       | 33      | US$ 28.586,25 | US$ 347,49 | 6,9     | nenhum            |
| US$ 430 | 100%      | 41      | US$ 35.516,25 | US$ 430,00 | 6,9     | teto              |
| US$ 90  | 80%       | 8       | US$ 6.930,00  | US$ 84,24  | 6,9     | mínimo            |
| US$ 60  | 80%       | 8       | US$ 6.930,00  | US$ 60,00  | 9,6     | mínimo + teto     |
| US$ 60  | 50%       | 8       | US$ 6.930,00  | US$ 60,00  | 9,6     | mínimo + teto     |

Os avisos de transparência (mínimo de 8 painéis e economia limitada à conta) aparecem sempre que as
flags `minimumPanelsApplied` e `savingsCappedAtBill` estão ativas. Cada aviso tem ícone e texto; a cor
não é o único sinal.

---

## 4. Decisões tomadas

- **A URL é a estimativa.** O simulador grava `?bill=…&coverage=…` na URL com `history.replaceState`
  (debounce de 250 ms) e preserva UTMs e qualquer outro parâmetro. Assim, "compartilhar o endereço com
  outra pessoa" leva o mesmo cenário, sem banco de dados.
- **Link compartilhado sem hydration mismatch.** A página é estática e o servidor não enxerga a query
  string. O servidor renderiza os valores padrão; logo após a hidratação, `useSyncExternalStore` lê a
  query de entrada **uma única vez** e remonta o formulário com os valores do link (só quando eles são
  diferentes do padrão). Os valores da URL passam por `normalizeToRange` (limites e passo).
- **`dynamicParams = false`.** Um slug que não está registrado vira um 404 de verdade, e nada é
  renderizado sob demanda.
- **Redirect de `/` em `next.config.ts` (307, não 308).** Next repassa a query string, então as UTMs de
  campanha sobrevivem. O redirect é temporário porque `/` pode virar um índice de cidades no futuro.
- **Perfis de residência como `radio`.** Escolher um perfil preenche a conta. O perfil marcado é
  derivado da conta atual, então ele desmarca sozinho quando a pessoa ajusta o slider.
- **"Show the math".** O depoimento do Kevin D. elogia justamente isso, e o simulador mostra cada passo
  com os números da pessoa. Isso gera confiança sem inventar dado nenhum.
- **Fontes auto-hospedadas** (Fraunces para títulos e Instrument Sans para texto) com `next/font/local`.
  Nem o build nem o runtime dependem do Google Fonts.
- **Imagem Open Graph gerada no build**, para que o link compartilhado no WhatsApp ou iMessage tenha
  preview. Não usa imagem remota.
- **Conteúdo da página em inglês (en-US)**, porque o mercado é americano. A documentação está em
  português.

---

## 5. Suposições e limitações

- A fórmula segue exatamente a especificação. Ela não considera:
  - reajuste de tarifa;
  - degradação dos painéis;
  - tarifas por horário (TOU) ou demanda da APS;
  - financiamento;
  - orientação e sombreamento do telhado;
  - variação sazonal.

  Os 30 dias por mês são fixos, como na especificação.
- A conta é tratada como 100% energia (US$/kWh). Taxas fixas da distribuidora não entram, o que
  tende a superestimar um pouco o consumo em kWh. Essa limitação está declarada na página ("Assumes
  today's rate…").
- O crédito de energia excedente é descrito de forma genérica ("vira crédito, não dinheiro"), sem
  citar as regras de exportação da APS.
- Empresa, equipes, depoimentos e telefone (555) são fictícios, e o rodapé diz isso.
- `/api/analytics` só registra o evento; não há fila, persistência nem deduplicação.
- A captura de UTMs é *last-touch* por sessão (`sessionStorage`). Uma atribuição *first-touch* entre
  sessões exigiria cookie ou armazenamento persistente, o que pede consentimento.
- `JsonLd` não publica `aggregateRating`: sem uma fonte de avaliações verificável, o Google trata isso
  como *self-serving review*.

---

## 6. Analytics

**Contrato** (`src/lib/analytics/events.ts`), compartilhado entre o cliente e a API:

```ts
{
  event: "simulation_updated" | "cta_clicked",
  city: "phoenix-az",
  path: "/solar/phoenix-az",
  utm_source: string | null,
  utm_medium: string | null,
  utm_campaign: string | null,
  timestamp: "2026-09-28T14:28:39.290Z",
  properties: { ... }   // tipadas por evento
}
```

- `simulation_updated`: disparado com **debounce de 800 ms**, uma vez por ajuste e não a cada passo do
  slider. Nunca dispara no carregamento. Propriedades: `monthly_bill`, `coverage_percent`, `panels`,
  `net_investment`, `monthly_savings`, `payback_years`, `minimum_panels_applied`, `savings_capped` e
  `input` (`bill`, `coverage` ou `profile`).
- `cta_clicked`: capturado por um listener delegado (fase de captura, então dispara antes do `tel:`)
  em qualquer elemento com `data-cta`. Propriedades: `cta`, `location` e `href`. Há 10 CTAs
  instrumentados: header, hero ×2, simulador ×2, CTA final ×2, barra mobile ×2 e rodapé.

**Atribuição:** as UTMs da URL de entrada são salvas em `sessionStorage`. Por isso continuam presentes
depois que o simulador reescreve a query, depois de recarregar a página e no redirect de `/`.

**Transporte:** `navigator.sendBeacon` para `/api/analytics`, que sobrevive ao unload e ao toque em
`tel:`. Se não houver beacon, usa `fetch(..., { keepalive: true })`. Uma falha no analytics nunca
quebra a página. A rota valida o payload (tamanho ≤ 8 KB, JSON válido, guard de tipo) e responde
`202`, `400`, `413` ou `422`.

**Trocar por Segment, PostHog ou GA4:** basta registrar um transport. Nenhum componente muda.

```ts
import { registerTransport } from "@/lib/analytics/client";

// Segment
registerTransport({ name: "segment", send: (e) => window.analytics?.track(e.event, e) });
// PostHog
registerTransport({ name: "posthog", send: (e) => posthog.capture(e.event, e) });
// GA4 (gtag)
registerTransport({ name: "ga4", send: ({ event, properties, ...ctx }) => gtag("event", event, { ...ctx, ...properties }) });
```

O ideal é registrar o transport depois do consentimento (CMP), num client component. O transport local
pode continuar ativo como log de servidor.

---

## 7. Acessibilidade

- `<input type="range">` nativo com `<label for>` explícito e `aria-valuetext` ("$220 per month",
  "80 percent"). Setas, Page Up/Down, Home e End funcionam por padrão.
- Os valores dinâmicos usam `<output>`: o valor de cada slider e cada métrica do resultado.
- **Resultado com `aria-live`:** um `role="status"` com `aria-live="polite"` e `aria-atomic` anuncia um
  resumo completo **600 ms depois que a pessoa para de ajustar**. Um `aria-live` diretamente nos
  números anunciaria cada passo do slider.
- Os perfis são radios nativos dentro de `fieldset` e `legend`, com o foco aparecendo no card (`:has()`).
- A FAQ usa `<details>` e `<summary>`, com `<h3>` dentro do summary para manter a hierarquia de
  headings: `h1` → `h2` por seção → `h3`/`h4`.
- Foco visível com `:focus-visible` e anel duplo (claro e escuro), com variante para fundos escuros.
  Há skip link para o conteúdo principal.
- Contraste medido: texto principal com 15:1, texto secundário com 6,8:1, lima sobre verde com 9,6:1,
  CTA coral com texto escuro com 6,1:1 e texto claro secundário sobre verde com 7,2:1.
- Nenhuma informação depende só de cor: os avisos têm ícone e título em texto, e a nota em estrela tem
  "out of 5" para leitores de tela.
- `prefers-reduced-motion` desliga animações e o smooth scroll. Os alvos de toque têm pelo menos 44 px.
- O SVG decorativo do hero tem `aria-hidden`, e ícones ao lado de texto têm `aria-hidden`.

## 8. Performance

- A página é pré-renderizada em build (SSG) e pode ser servida inteira de CDN.
- O JavaScript no cliente se limita a três componentes pequenos. A lógica de cálculo tem poucas linhas
  e não usa biblioteca de gráficos.
- O Client Component recebe só os campos de que precisa (`SimulatorSection` filtra o `CityContent`),
  o que mantém o payload RSC enxuto.
- Não há imagens raster: o hero é um SVG inline, e o ícone e a imagem OG são gerados.
- Fontes: dois arquivos variáveis woff2 com subset latin, `display: swap` e fallback ajustado
  automaticamente pelo `next/font` para reduzir o CLS.
- Os números usam `font-variant-numeric: tabular-nums`, então os dígitos não mudam de largura
  enquanto o slider se move.
- Toda formatação usa `Intl` com `en-US` fixo e datas em UTC, então servidor e cliente geram strings
  idênticas.

---

## 9. Roteiro de vídeo (≈ 5 min)

1. **(0:00) Contexto, 30 s.** Uma página de cidade, pensada para 120 cidades, com foco em tráfego pago
   no celular.
2. **(0:30) Tour no celular, 60 s.** Hero, simulador (tocar no perfil "pool + EV" e subir a cobertura
   para 100% para mostrar o aviso de teto), resumo compacto, "Show the math" e barra fixa de ligação.
3. **(1:30) Compartilhar, 30 s.** Mostrar a URL mudando e abrir o link em outra aba com o mesmo
   cenário. Colar o link para mostrar o preview OG.
4. **(2:00) Código: a fórmula, 60 s.** `lib/solar.ts` (pura, com flags), `solar.test.ts` com a tabela
   de aceite e o caso do epsilon. Rodar `npm test`.
5. **(3:00) Código: escala, 45 s.** `content/cities/phoenix-az.ts` → `index.ts` →
   `CityLandingPage.tsx`. Mostrar que o template não tem valores de cidade e que `cities.test.ts`
   protege os próximos arquivos.
6. **(3:45) Analytics, 30 s.** Entrar com UTMs, mexer no slider, clicar num CTA e mostrar o JSON no
   terminal. Mostrar `registerTransport`.
7. **(4:15) A11y e SEO, 30 s.** Navegar só com o teclado, abrir `/sitemap.xml`, mostrar
   `/solar/xyz` → 404 e o título da aba.
8. **(4:45) Fechamento, 15 s.** Limitações declaradas e próximos passos (CMP, lead form, testes E2E).

---

## 10. Checklist de deploy

- [ ] Definir `NEXT_PUBLIC_SITE_URL` (veja `.env.example`). Na Vercel, `VERCEL_PROJECT_PRODUCTION_URL`
      é usado automaticamente quando a variável não existe.
- [ ] `npm run lint && npm run typecheck && npm test && npm run build` no CI, bloqueando o merge.
- [ ] Conferir `/sitemap.xml` e `/robots.txt` com o domínio final e enviar o sitemap ao Search Console.
- [ ] Validar o JSON-LD no Rich Results Test e o OG no validador de cards das redes.
- [ ] Testar `/?utm_source=…` → redirect 307 com UTMs → evento recebido.
- [ ] Ligar o transport real de analytics atrás do consentimento (CMP) e remover ou limitar o log local.
- [ ] Rodar Lighthouse (mobile) nas métricas de Performance, A11y e SEO e testar com VoiceOver/TalkBack.
- [ ] Confirmar que o telefone real (sem 555) e os dados da cidade foram revisados por negócio e jurídico
      (créditos fiscais!).
- [ ] Monitorar erros no cliente (Sentry ou similar) e a taxa de 4xx em `/api/analytics`.
- [ ] Headers de segurança e cache (CSP, HSTS) na borda.

---

## 11. Validações

Última execução local (Node 26, macOS):

```txt
npm run lint   → sem erros ou avisos
npm test       → 3 arquivos, 26 testes passando
npm run build  → compilado; /solar/phoenix-az e sua opengraph-image pré-renderizadas (SSG)
```
