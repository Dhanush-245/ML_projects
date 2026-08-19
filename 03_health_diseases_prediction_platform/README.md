<p align="center">
  <img src="public/og.png" alt="Medora AI healthcare intelligence platform" width="100%">
</p>

<h1 align="center">Medora AI — Health Intelligence Platform</h1>

<p align="center">
  A responsive healthcare product demo that turns personal health signals into understandable, safety-aware insights.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare">
  <img src="https://img.shields.io/badge/status-product%20demo-8B5CF6?style=for-the-badge" alt="Product demo">
</p>

## Overview

Medora AI combines health scoring, risk signals, activity trends, care-plan adherence, appointments, wearable status, and an AI guide in one polished interface. The experience demonstrates how complex health information can be presented with clear context and responsible safety language.

> [!CAUTION]
> Educational and research software only. Medora AI is not a certified medical device, does not diagnose disease, and is not a substitute for professional or emergency medical care.

## Product experience

- Personal health score with contributing factors and trend context
- Explainable cardiovascular, diabetes, and hypertension risk cards
- Activity, heart-rate, sleep, and wearable-sync summaries
- Interactive care-plan checklist and next-best-action guidance
- Appointment and AI-generated insight summaries
- Safety-aware assistant drawer for preparing questions for a clinician
- Patient, doctor, hospital, researcher, and administrator views
- Emergency-profile affordance and privacy messaging
- Responsive layout, keyboard-friendly controls, and status feedback
- Branded Open Graph image for high-quality link previews

The current interface uses realistic fictional data for **Alex Rivera**. It does not process or store real medical records.

## Architecture

```text
Browser
  └── React application
      ├── Role-based dashboard views
      ├── Health insights and care-plan UI
      ├── Optional ChatGPT identity helpers
      └── vinext/Vite build
          └── Cloudflare Worker runtime
              └── Optional D1/Drizzle persistence
```

## Project structure

```text
.
├── app/
│   ├── page.tsx               # Main product experience
│   ├── layout.tsx             # Application shell and metadata
│   ├── globals.css            # Global visual system
│   └── chatgpt-auth.ts        # Optional identity helpers
├── db/                        # Drizzle database wiring
├── drizzle/                   # Migration metadata
├── examples/d1/               # Optional D1 example
├── public/                    # Icons and social preview image
├── tests/                     # Rendered-output validation
├── worker/                    # Cloudflare Worker entry point
├── package.json
├── vite.config.ts
└── README.md
```

## Run locally

### Prerequisites

- Node.js 22.13 or newer
- npm

```bash
git clone https://github.com/Dhanush-245/ML_projects.git
cd ML_projects/03_health_diseases_prediction_platform
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
npm test
npm run lint
npm run build
```

The production build generates local output that is ignored by Git.

## Technology stack

- React and TypeScript
- vinext and Vite
- Tailwind CSS
- Cloudflare Workers and optional D1
- Drizzle ORM
- Node test runner and ESLint

## Production roadmap

1. Add identity, explicit consent, audit trails, and standards-based FHIR records.
2. Add encrypted persistence and role-based access control.
3. Integrate validated disease-specific models with model cards and calibration reports.
4. Add clinician-reviewed report extraction, messaging, appointments, and wearable connectors.
5. Add privacy review, bias monitoring, incident response, clinical validation, and controlled rollout.

Avoid autonomous diagnosis, treatment generation, or broad disease claims until the required clinical, legal, safety, and regulatory evidence exists.

## License

No license has been selected. Add a license before permitting reuse or redistribution.

## Author

**Lingareddy Dhanush** · [GitHub](https://github.com/Dhanush-245)
