# Checkout Journey Map — Returning Buyer (Volt theme)

**Persona:** Sai, a returning customer with one saved address, buying a single
physical item (Razer mouse). **JTBD:** "Pay quickly and get it shipped to my
saved address — I've done this before, don't make me re-enter everything."

The relevant journey is the **checkout micro-funnel** (the high-drop-off span
between cart and order), so the stages below are the on-page steps, not the
full awareness→advocacy arc.

## Stage-by-stage

| Stage | Touchpoint | User action | Emotion | Pain point | Opportunity |
|---|---|---|---|---|---|
| Enter checkout | `/checkout` | Sees Step 1 with **both** a saved-address card *and* a full empty form | 🙂→😕 | "Which one do I use? Why is the form empty if I have a saved address?" | Default to the saved address; collapse the form behind "Change address" |
| Pick saved address | "Deliver to this address" | Clicks it; page reloads, form now **prefilled** | 😕 confused | Looks like it only *prefilled* — the empty form + a second **"Save & Continue"** implies they're not done | One click = done. Show a read-only "Delivering to…" summary, no second save |
| Save address (manual path) | "Save & Continue" | Re-confirms the same data | 😤 redundant | Two buttons that look like they do the same thing ("Deliver to this address" vs "Save & Continue") | One primary action per step |
| Choose delivery | "Standard ₹0.00" radio → "Use this method" | Selects the only option, clicks confirm | 😐 friction | Selecting + confirming a *single free* option is a pointless click | Pre-select when there's exactly one option |
| Pay | Razorpay | Opens modal, pays | 🙂 | Payment unlocks even when the address was never really filled (empty-address orders) | Gate payment on a *complete* address |

## Critical moments

- **Moment of truth #1 — the saved-address card.** This is where the returning
  buyer decides "is this fast or annoying?" Today it reads as annoying: pick →
  reload → still see a form → save again.
- **Churn/error trigger — the empty address.** Medusa pre-creates an empty
  `shipping_address` (country only). The UI treated "object exists" as "address
  set", so buyers could pay with a blank address → orders shipped nowhere and
  Shiprocket push was skipped. This is both a UX honesty bug and a fulfilment bug.
- **Aha moment (target):** "I clicked my address once and the Pay button was
  right there."

## Prioritised improvements

| Priority | Change | Impact | Effort |
|---|---|---|---|
| P0 | Gate every step + payment on **address completeness**, not object existence | Stops blank-address orders (fulfilment + Shiprocket) and makes step ✓ badges honest | Low |
| P0 | **Collapse** Step 1 into a "Delivering to…" summary once an address is set; form moves behind "Change address" | Removes the #1 confusion (pick → still see empty form + Save) | Low |
| P1 | **Pre-select** the single delivery option | One fewer click | Low |
| P2 | Drop the duplicate "Address saved / scroll" helper button | Fewer competing buttons | Low |
| P3 | Later: auto-apply a sole shipping option server-side so Step 2 disappears entirely when there's one method | Removes a whole step | Med |

All P0–P2 are implemented in this change set; server actions
(`setAddressAction`, `setShippingMethodAction`, Razorpay) are unchanged.
