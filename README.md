# ezshop

**Stop shopping by opening more tabs. Start shopping by making better decisions.**

ezshop is a personal shopping workspace that turns scattered product research into a clear decision. It helps you
collect products as you browse, understand what each one actually offers, compare them side by side, and move from
endless research to a confident purchase.

## The problem

Online shopping is very good at showing products and surprisingly bad at helping you choose between them.

A single product page holds hundreds of details. Specifications are scattered across sections and buried under reviews,
offers, financing, promotions and marketing copy. Comparing two products means opening multiple tabs, remembering
numbers and switching back and forth to work out which differences actually matter.

The problem is not a lack of information. **The information needed to make a decision is fragmented.**

Shopping platforms are designed around selling individual products. They are not designed around helping you decide
between them, so the buyer ends up doing all the work. The more important the purchase, the worse it gets, and people
often decide from memory, intuition or whichever product they saw last.

## What ezshop does

ezshop sits between discovering a product and buying it.

1. **Save** products while you browse. You don't have to leave the page or copy anything by hand.
2. **Understand** each product through a clean, consistent spec sheet, free of store layouts and promotional noise.
3. **Compare** your shortlist. See what the products share, where they differ, and where one clearly wins.
4. **Decide** with confidence. The buyer always makes the final call.

## Who it's for

People who care about making a good purchase. They aren't necessarily experts. They might be choosing a phone, laptop,
monitor, headphones, camera or appliance, where several options look alike but differ in ways that matter. Their
priorities vary (price, battery, performance, weight, reliability, one specific feature), but the need is the same:
**they need to decide.**

## Core experience

- **A shortlist that builds itself.** Save a product, keep browsing, save another. Over time you have a collection of
  the products worth considering.
- **Consistent product pages.** Every product is presented the same way, so you can read it without learning a new
  layout each time.
- **Comparison where you shop.** When you look at a new product, ezshop shows how it stacks up against your shortlist.
  There is no need to remember which tab held the other one or to build your own spreadsheet.
- **A library you own.** Research doesn't vanish when a tab closes. Come back to it whenever you like, and organise it
  by category, store, brand or price.

## Comparison is the heart of the product

A comparison is more than two products side by side. It reduces a decision to its meaningful tradeoffs.

- **What they have in common.** Identical information stays out of the way.
- **Where they differ.** Only differences that could influence your choice ask for attention.
- **Where one clearly wins.** More battery and lower weight are generally better, and ezshop can say so.
- **Where preference matters.** A bigger screen isn't better for everyone. ezshop separates objective advantages from
  personal taste, and it doesn't pretend every decision has one correct answer.

## Where it's going

The current product starts with clear product information and comparison. The long-term vision is a **personal decision
layer for online shopping**:

- **Across stores.** A product on one marketplace should be comparable with a similar one on another. The question
  stops being "what's on Amazon?" and becomes "which of the products I'm considering is best?" The store is where you
  buy. ezshop is where you decide.
- **From specifications to understanding.** ezshop should move from displaying numbers to explaining them: what's
  better, what's worse, and what you actually gain by paying more.
- **From comparison to recommendation.** Tell ezshop what matters to you ("battery life matters most, I travel often,
  I don't care about display resolution") and the comparison reshapes around your priorities. One option emerges as the
  strongest fit, with a reasoned explanation, not just a score: *"This is the best fit for you because…"*

## Principles

- **Neutral.** ezshop works for the buyer. It isn't another store nudging you toward a product.
- **Clear.** No specialist knowledge required.
- **Honest.** Unknown information stays unknown.
- **Contextual.** A specification only matters relative to what you're trying to achieve.
- **Decision oriented.** Every part of the experience moves toward helping you choose.
- **You stay in control.** ezshop helps you decide and doesn't decide for you without explanation.
- **Research is an asset.** Every product you save reduces future effort, and you never repeat work you've already done.

## Run it locally

Prerequisites: [Bun](https://bun.sh) and Docker. Importing a product by pasting its URL also needs a self-hosted
Firecrawl instance (see `infra/firecrawl/README.md`).

```bash
bun install
cp .env.example .env
bun run db:up            # Postgres on 127.0.0.1:5433
bun run dev:api          # API on http://localhost:8787
bun run dev:web          # App on http://localhost:5173
bun run dev:landing      # Landing page on http://localhost:5174
bun run build:extension  # Browser extension build in apps/extension/dist
```

To load the extension, open `chrome://extensions`, turn on Developer mode, choose **Load unpacked** and select
`apps/extension/dist`.
