# MeteorGuard

Dashboard meteorológico estático com dados da Open-Meteo, painel de risco híbrido, radar incorporado, gráfico semanal, favoritos, i18n e chat meteorológico via rota serverless.

## Rodar localmente

```powershell
python -m http.server 5179 --bind 127.0.0.1
```

Abra:

```text
http://127.0.0.1:5179
```

Para validar as rotas serverless localmente, use a Vercel CLI:

```powershell
vercel pull --yes
vercel dev
```

## Variáveis de ambiente

Configure na Vercel, nunca no frontend:

```text
API_KEY=...
ALLOWED_ORIGIN=https://meteorguard.vercel.app
GROQ_API_KEY=...
GROQ_MODEL=llama-3.1-8b-instant
```

`GROQ_API_KEY` é opcional para a tela principal, porque a análise tem fallback determinístico. O chat com LLM depende dela.

## Rotas

```text
POST /api/predict
```

Exige `x-api-key` e calcula risco meteorológico a partir de dados numéricos.

```text
POST /api/chat
```

Proxy serverless para a Groq. Aceita apenas origens permitidas em produção e aplica rate limit em memória.

## Segurança

- Não commitar `.env.local` ou `.vercel/`.
- Rotacionar qualquer segredo que tenha sido exposto em arquivo, print, zip ou chat.
- O rate limit atual é em memória e serve para reduzir bursts. Para produção mais forte, use Upstash Redis, Vercel KV ou outro armazenamento distribuído.
- O modelo de IA é híbrido e experimental; não substitui alertas oficiais.
