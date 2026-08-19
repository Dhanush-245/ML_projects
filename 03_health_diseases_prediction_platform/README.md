# Medora AI

Medora AI is a polished, responsive healthcare-intelligence product demo focused on making personal health data understandable and actionable. It combines risk signals, health scoring, activity trends, care-plan adherence, appointments, wearable sync, and a safety-aware AI guide in one interface.

> Educational and research software only. Medora AI is not a certified medical device, does not provide diagnosis, and is not a substitute for professional or emergency medical care.

## Product experience

- Personal health score with contributing signals and trend context
- Explainable cardiovascular, diabetes, and hypertension risk cards
- Activity, heart-rate, sleep, and wearable-sync overview
- Interactive care-plan checklist and next-best-action guidance
- Appointment and AI-generated insight summaries
- Medora assistant drawer with doctor-question preparation and explicit guardrails
- Emergency-profile affordance, privacy messaging, responsive mobile layout, keyboard-friendly controls, and status feedback
- Branded Open Graph card for high-quality link previews

The interface uses realistic demo data for “Alex Rivera.” No real medical records are processed or stored by this frontend.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
npm run build
npm run lint
```

## Production roadmap

The current build is a portfolio-grade product frontend. A real clinical deployment should add validated FastAPI services, standards-based FHIR/HL7 interoperability, consent and identity workflows, encrypted persistence, audited role-based access, model cards, calibration and bias monitoring, human review, incident response, clinical validation, regional privacy compliance, and regulatory review before processing real patient data.

Recommended delivery sequence:

1. Identity, consent, audit trail, and FHIR-based patient records
2. Report upload/OCR with clinician-reviewed extraction
3. Disease-specific models with model cards and external validation
4. Secure messaging, appointments, notifications, and wearable connectors
5. Hospital/research workspaces, MLOps, drift monitoring, and controlled rollout

Avoid launching payment, autonomous diagnosis, treatment generation, or broad “40 disease” claims until the underlying clinical, regulatory, and safety evidence exists.
