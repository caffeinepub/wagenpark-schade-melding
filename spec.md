# WagenPark Schade Melding

## Current State
The app has a working fleet damage reporting system with:
- Login via Internet Identity + invite links
- Three separate report forms: Schademelding, Storing Voertuig, Mankement
- Dashboard with KPI cards and filterable reports table (admin sees all, employees see own)
- Vehicle management (admin only)
- Report detail page with status updates (Open → In Reparatie → Opgelost)
- Reports stored as `DamageReport` with fields: vehicleId, damageType, description, severity, locationDescription, status, photoIds

## Requested Changes (Diff)

### Add
- New `InspectionRound` data type in backend: id, reporterName, standplaats, trekkerKenteken, aanhangerKenteken, reportDate, reportedBy, items (array of InspectionItem)
- New `InspectionItem` type: category (enum), subcategory, description, quantity (optional Nat), photoIds, stillPresent (bool for follow-up)
- Categories: schade, technisch, banden, vloeistoffen, veiligheid_lading, documenten, interieur, overig
- Backend functions: `addInspectionRound`, `getAllInspectionRounds`, `getInspectionRoundsByStandplaats`, `getMyInspectionRounds`, `getInspectionStats`
- New page `/rondje` — "Rondje Melden" multi-step form:
  - Step 1: Datum/tijd, naam melder, standplaats, trekker kenteken, aanhanger kenteken
  - Step 2: Ja/Nee vraag of er meldingen zijn; bij Ja: category checkboxes (multi-select)
  - Step 3: Per geselecteerde categorie: subcategory checkboxen + omschrijving + hoeveelheid + foto upload
  - Submit → opslaan als InspectionRound
- New "Rondje Melden" button on dashboard (primary/prominent)
- Dashboard tab "Planner Overzicht" with:
  - Meldingen per maand per standplaats, uitgesplitst per categorie
  - Actie-items tabel: standplaats + categorie + count + totaal hoeveelheid + actie aanbeveling
  - Overzicht veelvoorkomende "Overig" meldingen

### Modify
- Dashboard: add second tab "Planner Overzicht" alongside existing "Meldingen" tab
- App.tsx: add `/rondje` route
- Layout/nav: add link to rondje melden

### Remove
- Nothing removed (all existing forms stay)

## Implementation Plan
1. Extend `main.mo` with InspectionItem and InspectionRound types, storage map, and CRUD + stats functions
2. Generate updated `backend.d.ts` bindings
3. Create `src/frontend/src/pages/NieuweRondje.tsx` — multi-step inspection form
4. Update `Dashboard.tsx` to add tabs and Planner Overzicht section
5. Update `App.tsx` to add `/rondje` route
6. Update `Layout.tsx` to add nav link
