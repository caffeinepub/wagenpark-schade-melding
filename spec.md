# WagenPark Schade Melding

## Current State
The damage report form (NieuweSchademelding.tsx) uses a dropdown to select a vehicle from a pre-loaded list. There is no time field. Vehicle type (trekker/aanhanger) is selected via the dropdown.

## Requested Changes (Diff)

### Add
- Time field at the top of the form (tijdstip van schade, time input, prefilled with current time)
- Trekker kenteken text input (manual entry)
- Aanhanger kenteken text input (manual entry)

### Modify
- Remove the vehicle dropdown selector
- Replace vehicle selection with the two manual kenteken fields (trekker + aanhanger)
- On submit: look up vehicles by vehicleNumber using getAllVehicles(). Match trekker kenteken to a vehicle to get vehicleId. Store aanhanger kenteken in locationDescription (prefixed, e.g. "Aanhanger: XX-000-X | " + user location)
- The time field value should be included in the description or stored as part of the report (prepend to description: "Tijdstip: HH:mm | " + description)
- Keep all other fields: damageType, description, severity, locationDescription, photos

### Remove
- Vehicle dropdown (Select component for vehicle)
- getCachedVehicles() usage

## Implementation Plan
1. Add time state (default = current time HH:mm)
2. Add trekkerKenteken and aanhangerKenteken state strings
3. On form load, call getAllVehicles() via useQuery to have the full list available for lookup
4. On submit: find matching vehicle by vehicleNumber === trekkerKenteken; if not found, show toast error
5. Prepend tijdstip to description and aanhanger kenteken to locationDescription when submitting
6. Update form layout: time → trekker kenteken → aanhanger kenteken → damage type → description → severity → location → photos → submit
