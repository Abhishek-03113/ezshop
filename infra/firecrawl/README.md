# Self-hosted Firecrawl for ezshop

Firecrawl itself is not vendored. Clone it next to this repo's root and drop in our low-memory override:

```bash
git clone https://github.com/firecrawl/firecrawl.git firecrawl   # ignored by .gitignore
cp infra/firecrawl/docker-compose.override.yaml firecrawl/
mkdir -p firecrawl/poc && cp infra/firecrawl/poc/rabbitmq.conf firecrawl/poc/
cd firecrawl && docker compose up -d                              # API on http://localhost:3002
```

The override uses prebuilt images and caps the stack at ~3.9 GB (peak ~2.55 GB). The research behind those limits
is in `research/FINDINGS.md` §6. No LLM is needed: ezshop only asks for `rawHtml`.
