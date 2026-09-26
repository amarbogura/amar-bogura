# 03 — Dynamic Form Engine & Template Catalog

This is the core feature. Every service request, custom request and listing is rendered from a
versioned JSON template, validated by a Zod schema **built from that template**, on both client
and server, using the same code.

## 1. Architecture

```
FormTemplate (key: "vehicle_rent")
   └─ FormTemplateVersion v3 { schema: FormSchema }  ← currentVersion
            │
            ├─ buildZodSchema(schema, ctx)  → used by RHF zodResolver (client) + server action
            ├─ <DynamicForm schema=… />     → renders sections/fields, handles showIf
            ├─ <DetailsView schema=… data=…/> → read-only render for admin + "My Requests"
            └─ summarize(schema, data)       → 1-line summary for admin lists / listing cards
```

Location: `src/features/forms/` → `types.ts`, `build-zod.ts`, `visibility.ts`, `renderer/`,
`fields/<type>.tsx`, `details-view.tsx`, `summarize.ts`, `templates/*.ts` (seed sources), `__tests__/`.

## 2. Schema types (TypeScript — source of truth)

```ts
export type I18n = { bn: string; en?: string };

export type FieldType =
  | 'text' | 'textarea' | 'number' | 'money' | 'phone' | 'url'
  | 'select' | 'multiselect' | 'radio' | 'checkboxes' | 'boolean'
  | 'date' | 'time' | 'datetime' | 'daterange'
  | 'area'            // Area picker (upazila → area)
  | 'address'         // area + address line + optional landmark (object)
  | 'route'           // { from: address, to: address } — shifting, rental, courier
  | 'person'          // { name, phone } — e.g. courier recipient
  | 'item_list'       // repeater [{ name, qty, unit }] — grocery, bazar, medicine
  | 'images'          // Cloudinary media ids (max N)
  | 'heading';        // display-only section text

export interface Option { value: string; label: I18n }

export interface ShowIf {
  field: string;                         // key of another field in same template
  op: 'eq' | 'neq' | 'in' | 'notIn' | 'truthy' | 'falsy';
  value?: string | number | boolean | Array<string | number>;
}

export interface FormField {
  key: string;             // stable camelCase; NEVER renamed once published
  type: FieldType;
  label: I18n;
  placeholder?: I18n;
  help?: I18n;
  required?: boolean;
  options?: Option[];      // select / multiselect / radio / checkboxes
  defaultValue?: unknown;
  validation?: {
    min?: number; max?: number;           // number/money/date offsets(days)/item count
    minLength?: number; maxLength?: number;
    pattern?: string; patternMessage?: I18n;
    maxFiles?: number;                   // images (hard cap 8)
    units?: string[];                    // item_list units: kg, g, litre, piece, packet, dozen
  };
  showIf?: ShowIf | ShowIf[];            // array = AND
  width?: 'full' | 'half';
  summary?: boolean;       // include in admin list summary / listing card chips
  filterable?: boolean;    // listings only: expose as filter on browse page
}

export interface FormSection { key: string; title: I18n; description?: I18n; fields: FormField[] }

// Common fields are real DB columns; the template only configures them.
export type CommonMode = 'required' | 'optional' | 'hidden';
export interface CommonFieldConfig {
  address?: CommonMode;          // area + addressLine (hide when template uses 'route')
  preferredDate?: CommonMode;
  preferredTimeSlot?: CommonMode;
  notes?: CommonMode;
  photos?: CommonMode;           // generic photos (max 5)
  altPhone?: CommonMode;
}

export interface FormSchema {
  schemaVersion: 1;
  kind: 'REQUEST' | 'LISTING';
  common: CommonFieldConfig;     // contactName + contactPhone always required for REQUEST
  sections: FormSection[];
  submitLabel?: I18n;            // default "রিকোয়েস্ট পাঠান"
  notice?: I18n;                 // e.g. prescription legal note
}
```

A meta-schema (`formSchemaSchema`, Zod) validates templates themselves: unique keys, `showIf` refers
to an existing earlier field, options exist for choice types, no reserved keys (`contactName`,
`contactPhone`, `areaId`, `addressLine`, `preferredDate`, `preferredTimeSlot`, `notes`, `title`, `price`…).

## 3. Engine behaviour (must be unit-tested)

1. **Visibility first.** `computeVisible(schema, values)` evaluates `showIf` in field order. Hidden
   fields are **stripped** from submitted data and never validated as required.
2. **buildZodSchema(schema, { mode: 'client' | 'server' })**
   - Maps each type to Zod (`number` → `z.coerce.number()`, `phone` → BD regex + normalize,
     `date` → ISO date not in the past unless `validation.min` allows, `item_list` → array min 1,
     `images` → array of media ids max `maxFiles`).
   - Server mode additionally verifies media ids belong to the current user and are TEMP.
   - Unknown keys are stripped (`.strip()`), strings trimmed, HTML rejected.
   - Implemented as: strip hidden → `z.object(shape).superRefine` for cross-field rules
     (e.g. `route.to` ≠ `route.from`, `endDateTime > startDateTime`).
3. **Server action flow** (`submitServiceRequest`):
   rate-limit → session OR guest path (guest: Turnstile token + honeypot + blocked-phone check; logged-in Google user without verified phone → prompt phone OTP first) → load service → resolve template → load **current version** →
   build Zod → validate common + details → create request (+ `code`) in a transaction → attach media
   (TEMP→ATTACHED) → `RequestEvent CREATED` → enqueue notifications → return code.
4. **Rendering**: mobile-first, one column; `width: 'half'` becomes two columns only ≥ 640px.
   Long forms are split into steps per section with a progress bar ("ধাপ ২/৩"); the final step always
   shows contact & location (common fields) and a review summary.
5. **Prefill**: logged-in user's name, phone, area prefilled. Draft autosaved to `sessionStorage`
   keyed by service slug (Web app is our own domain — browser storage is fine here).
6. **DetailsView** renders stored `details` with labels from the stored `formVersion`, never the
   current version.
7. **Versioning**: admin edits a template → validate with meta-schema → insert new
   `FormTemplateVersion(version+1)` → set `currentVersionId`. Old versions are immutable.
8. **Service context**: the renderer receives `{ service }`; a field may declare
   `defaultValue` and the admin may pin a field by setting `showIf` on a hidden `variant` field
   (see AC template). Keep this simple — no expression language.

## 4. Template catalog (seed these as `src/features/forms/templates/*.ts`)

Legend: **R** = required, (s) = summary field, (f) = filterable. Labels must be written in natural
Bangla by Claude Code; English here is only the spec. "Common" lists the `common` config.

### 4.1 Home & Office Services

**`home_shifting`** — Home / Office Shifting
Common: address hidden (uses route), preferredDate R, timeSlot optional, notes, photos optional
- `shiftType` radio R (s): home / office
- `route` route R: from & to (area + address), with `fromFloor` number, `fromLift` boolean, `toFloor`, `toLift`
- `size` select R (s): 1 room, 2 rooms, 3 rooms, 4+ rooms, small office, medium office, large office
- `majorItems` checkboxes: fridge, AC, bed/khat, almirah, sofa, dining table, TV, washing machine, computer set
- `needPacking` boolean; `needAcUninstall` boolean (showIf majorItems includes AC)
- `vehiclePref` radio: pickup / truck / let us decide
- `siteVisit` boolean: "আগে পরিদর্শন করে দাম জানাতে চাই"

**`electrician`** — Electrician
Common: address R, preferredDate R, timeSlot R, photos optional
- `problemTypes` checkboxes R (s): new wiring, repair wiring, switch/socket, fan install/repair, light fitting, IPS/inverter, meter/breaker, other
- `description` textarea R (max 500)
- `urgency` radio R (s): normal / today / emergency (→ sets priority HIGH)

**`ac_service`** — shared by AC Service & Repair, AC Cleaning/Washing, AC Installation
Common: address R, preferredDate R, timeSlot R, photos optional
- `variant` select R (s) — default set per service (repair / cleaning / installation); hidden when service pins it
- `acType` radio R (s): split / window / cassette / portable
- `capacity` select R (s): 1 ton, 1.5 ton, 2 ton, 2.5+ ton, don't know
- `unitCount` number R min 1 max 20 (s)
- `brand` text optional
- `problem` textarea R — showIf variant = repair
- `lastServiced` select — showIf variant = cleaning: <6 months, 6–12 months, >1 year, never
- `installKind` radio R — showIf variant = installation: new unit / reinstall (shifted)
- `pipeProvided` boolean — showIf variant = installation
- `floor` number optional; `outdoorPlacement` radio — showIf installation: wall bracket / roof / balcony

**`washing_machine`** — Repair and Setup/Installation (variant pinned per service)
- `variant` (repair / installation), `machineType` radio R (s): front load / top load / semi-auto
- `brand` text, `capacityKg` number optional
- `problem` textarea R — showIf repair; `errorCode` text — showIf repair
- `waterPointReady` boolean — showIf installation

**`plumber`**
- `problemTypes` checkboxes R (s): leak, pipe line, basin/commode install, water pump/motor, tank, drain block, other
- `description` textarea R; photos optional; urgency radio

**`painter`**
- `scope` radio R (s): interior / exterior / both
- `roomCount` number or `areaSqft` number (one required — superRefine)
- `surface` radio: new wall / repaint; `paintSupply` radio R: I provide / you arrange
- `siteVisit` boolean default true

**`cctv`**
- `premise` radio R (s): home / shop / office / factory / other
- `cameraCount` number R (s) min 1 max 64
- `cameraType` radio: IP / analog / advise me
- `recorder` boolean "DVR/NVR লাগবে"; `mobileView` boolean; `existingSetup` boolean
- `siteVisit` boolean default true

### 4.2 Rent a Vehicle — **`vehicle_rent`** (one template, `vehicleType` pinned per service)
Common: address hidden (uses route), preferredDate hidden (uses start), photos hidden
- `vehicleType` select R (s): car / cng / pickup / van / truck (pinned + hidden per service)
- `tripType` radio R (s): one-way / round trip / day-long / multi-day / hourly
- `route` route R (pickup → destination; destination may be outside Bogura — free text allowed)
- `startAt` datetime R; `returnAt` datetime R — showIf tripType in [round, multi-day]; `hours` number — showIf hourly
- `passengers` number — showIf vehicleType in [car, cng, van]
- `acRequired` boolean — showIf vehicleType in [car, van]
- `carClass` select — showIf car: sedan / premium / microbus 7–11 seat
- `goods` textarea R — showIf vehicleType in [pickup, truck]; `approxWeight` select: <500kg, 0.5–1t, 1–3t, 3–5t, 5t+
- `truckSize` select — showIf truck: 1 ton / 3 ton / 5 ton / 7.5 ton / covered van
- `needLabour` boolean + `labourCount` number (showIf needLabour) — showIf pickup/truck

### 4.3 Courier & Local Delivery — **`courier`** (Parcel, Document, Shop-to-Home) and **`pickup_drop`**
`courier`:
- `itemType` radio R (s): document / small parcel / large parcel / fragile / food
- `approxWeight` select: <1kg, 1–5kg, 5–10kg, 10kg+
- `sender` person R + `pickupAddress` address R
- `recipient` person R + `dropAddress` address R
- `pickupTime` datetime R; `speed` radio: regular (same day) / express (2–3 hrs)
- `collectCash` boolean + `cashAmount` money (showIf collectCash) — shop-to-home COD
`pickup_drop`: `what` radio R: person / item; `route` R; `startAt` R; `returnTrip` boolean; `note`.

### 4.4 Local Products & Grocery — **`grocery_order`** (Milk, Vegetables, Local Products, Packaged Grocery, Daily Essentials)
Common: address R, preferredDate R ("প্রথম ডেলিভারির তারিখ"), timeSlot R
- `items` item_list R (s) min 1 max 40; units: kg, g, litre, piece, packet, dozen, hali
  (Fresh Milk service: pre-populate one row "দুধ", unit litre)
- `frequency` radio R (s): one-time / daily / weekly / monthly
- `durationDays` number — showIf frequency ≠ one-time (e.g. 30)
- `substitution` radio: call me / substitute similar / skip item
- `budgetMax` money optional

### 4.5 Bazar & Medicine Delivery
**`bazar`** (Monthly Bazar, Bazar on Demand)
- `bazarType` pinned: monthly / on-demand
- `items` item_list R — or `listPhoto` images (one of them required — superRefine)
- `familySize` number — showIf monthly; `deliverySchedule` select — showIf monthly: once / twice / weekly
- `preferredMarket` text optional (e.g. ফতেহ আলী বাজার, রাজাবাজার)
- `budget` money R (s); `advanceNote` heading: admin will confirm advance/payment on call

**`medicine_delivery`** — Emergency Medicine Delivery (priority HIGH)
- `prescription` images (max 3) — R if any prescription drug
- `medicines` item_list (name, qty, unit: pcs/strip/box/bottle) — one of prescription/medicines required
- `urgency` radio R (s): within 1 hour / today
- `patientName` text optional
- notice: "প্রেসক্রিপশন ছাড়া প্রেসক্রিপশন-ওষুধ সরবরাহ করা হবে না।"

### 4.6 Wedding & Event Services
**`event_media`** (Photography, Videography — `mediaType` pinned)
- `eventType` select R (s): wedding / holud / reception / engagement / aqiqah / birthday / corporate / other
- `eventDate` date R (s) (preferredDate hidden); `venue` address R
- `days` number R default 1; `hoursPerDay` number
- `side` radio: bride / groom / both
- `deliverables` checkboxes: edited photos, printed album, cinematic video, full video, drone, same-day edit
- `budgetRange` select R (s): <10k, 10–25k, 25–50k, 50k–1L, 1L+; `referenceLinks` url optional

**`makeup`**: `lookType` select R (s): bridal / holud / reception / party / engagement; `persons` number R;
`location` radio R: home service / studio; `eventDate` date R; `startTime` time R; `budgetRange` select.

**`mehendi`**: `persons` number R; `design` radio R: simple / medium / bridal full (hands+feet); `eventDate` R; `referencePhotos` images.

**`event_decoration`**: `eventType` R; `venueType` select R: home / rooftop / community centre / convention hall / outdoor;
`elements` checkboxes: stage, gate, lighting, flower, photo booth, table decor; `theme` text; `guestCount` number;
`eventDate` R; `budgetRange` R; `referencePhotos` images.

### 4.7 Education — **`home_tutor`** (ProTutors Bogura)
- `studentClass` select R (s): Play–5, 6–8, SSC (9–10), HSC (11–12), admission, O/A level, university, other
- `medium` radio R (s): Bangla medium / English version / English medium / Madrasa
- `group` radio — showIf class in [SSC, HSC]: science / commerce / arts
- `subjects` checkboxes R (s) — options change by class (keep one list; admin can edit)
- `studentCount` number default 1; `studentGender` radio
- `tutorGender` radio R: male / female / any
- `daysPerWeek` select R: 2/3/4/5/6; `preferredTime` time
- `salaryBudget` money R (s) per month
- `tutorPreference` checkboxes: university student, experienced teacher, specific institution (text)

### 4.8 Emergency — **`ambulance`** (priority EMERGENCY; guest flow must be the fastest path — Turnstile invisible/managed mode, never blocks the Call button)
Page shows a huge **Call now** button (`tel:` hotline from SiteSetting) ABOVE the form.
Common: address hidden (uses route), preferredDate hidden, notes optional, photos hidden
- `when` radio R: now / scheduled; `scheduledAt` datetime — showIf scheduled
- `ambulanceType` radio R (s): non-AC / AC / ICU / oxygen support / freezer (dead body)
- `route` route R: pickup (in Bogura) → destination (hospital/city, free text)
- `patientCondition` text optional (max 150)
Server: triggers immediate admin notification (email + Telegram) regardless of queue.

### 4.9 IT & Digital Services — base **`digital_service`** + small per-service templates (clone base)
Base fields: `businessName` text, `businessType` select, `existingLinks` url(s), `goal` textarea R,
`budgetRange` select R (s), `timeline` select R: urgent / 1 week / 2–4 weeks / flexible, `attachments` images.
Additions per service (separate templates cloned from base):
- `fb_ads`: `objective` radio R (s): messages / sales / leads / page likes / awareness; `monthlyAdBudget` money R; `pageUrl` url R
- `seo`: `websiteUrl` url R; `targetKeywords` textarea; `targetArea` radio: Bogura / Bangladesh / global
- `video_editing`: `videoType` select (reel, YouTube, ad, wedding, corporate); `videoCount` number; `rawDuration` text; `footageLink` url
- `web_dev`: `siteType` select R (s): business / e-commerce / portfolio / booking / news / custom; `pages` number; `features` checkboxes (payment, login, blog, bangla-english); `hasDomain` boolean
- `software_dev`: `platform` checkboxes: web / android / iOS / desktop; `description` textarea R (min 50)
- `graphics`: `designTypes` checkboxes R (s): logo, banner, social posts, packaging, print, brand kit; `quantity` number
- `influencer`: `platforms` checkboxes R; `niche` text; `audienceArea` radio; `campaignBudget` money R

### 4.10 Custom Request — **`custom_request`**
Common: address R, preferredDate optional, timeSlot optional, photos optional (max 3)
- (column) `title` R max 80
- `description` textarea R min 20 max 1000
- `categoryHint` select optional: list of active categories + "অন্য কিছু"
- `budget` money optional
Admin adds `adminTags` to cluster repeated requests → future categories.

### 4.11 Generic fallback — **`generic_service`**
`description` textarea R + all common fields optional/required as default. Used when admin creates a
new service before designing its form.

## 5. Listing attribute templates (kind LISTING)

Common listing columns (always present, not in template): title, description, price, pricePeriod,
negotiable, condition (marketplace), area, addressLine, contactName, contactPhone, whatsappEnabled, photos (1–8 R).

| Template | Fields |
|---|---|
| `listing_mobile_computer` | `deviceType` (f,s) mobile/laptop/desktop/tablet/accessory · `brand` (f,s) · `model` R · `ram` · `storage` · `warrantyLeft` · `boxAvailable` · `accessories` checkboxes · `purchaseYear` |
| `listing_furniture` | `furnitureType` (f,s) bed/sofa/table/almirah/chair/showcase/other · `material` wood/board/steel/other · `quantity` |
| `listing_electronics` | `itemType` (f,s) TV/fridge/AC/washing machine/IPS/fan/other · `brand` (f) · `model` · `warrantyLeft` |
| `listing_bike` | `brand` (f,s) · `model` R · `year` (f,s) · `kmRun` (s) · `engineCc` (f) · `registered` boolean · `regYear` · `papersUpdated` boolean · `taxTokenValid` boolean |
| `listing_car` | `brand` (f,s) · `model` R · `year` (f,s) · `kmRun` · `fuel` (f) petrol/octane/diesel/CNG/hybrid · `transmission` (f) · `regYear` · `fitnessValid` boolean |
| `listing_other` | — (description only) |
| `listing_property_rent` | promoted columns: propertyType (f), bedrooms (f), bathrooms (f), size, availableFrom, price per month · attributes: `floor`, `totalFloors`, `balconies`, `furnished` (f) none/semi/full, `gas` line/cylinder/none, `lift`, `parking`, `tenantPref` (f) family/bachelor-male/bachelor-female/any, `advanceMonths`, `serviceCharge` |
| `listing_property_sale` | promoted columns: propertyType (f), size + sizeUnit (land: DECIMAL/KATHA/BIGHA), bedrooms, price · attributes: `roadWidthFt`, `landType` residential/commercial/agricultural, `ownershipDocs` checkboxes (দলিল, খতিয়ান, নামজারি, খাজনা হালনাগাদ), `facing`, `floor` |

Property rules: `propertyType` options are limited by `ListingCategory.propertyTypes`; LAND hides bedrooms/bathrooms;
size unit SQFT for built property, DECIMAL/KATHA/BIGHA for land.

## 6. Seed mapping (category → sub-items → template)

| # | Category (kind, slug) | Sub-items (slug → template) |
|---|---|---|
| 1 | Home & Office Services (SERVICE, `home-office`) | home-office-shifting→home_shifting · electrician→electrician · ac-repair→ac_service(repair) · ac-cleaning→ac_service(cleaning) · ac-installation→ac_service(installation) · washing-machine-repair→washing_machine(repair) · washing-machine-installation→washing_machine(installation) · plumber→plumber · painter→painter · cctv-installation→cctv |
| 2 | Rent a Vehicle (SERVICE, `rent-a-vehicle`) | rent-a-car · rent-a-cng · rent-a-pickup · rent-a-van · rent-a-truck → vehicle_rent (vehicleType pinned) |
| 3 | Courier & Local Delivery (SERVICE, `courier-delivery`) | parcel-delivery→courier · document-delivery→courier · local-pickup-drop→pickup_drop · shop-to-home-delivery→courier |
| 4 | Buy & Sell (MARKETPLACE, `buy-sell`) | property (tile → /property?purpose=sale) · mobile-laptop→listing_mobile_computer · furniture · electronics · bike · car · others |
| 5 | Local Products & Grocery (SERVICE, `local-products-grocery`) | fresh-milk · fresh-vegetables · local-products · packaged-grocery · daily-essentials → grocery_order |
| 6 | Bazar & Medicine Delivery (SERVICE, `bazar-medicine`) | monthly-bazar→bazar · bazar-on-demand→bazar · emergency-medicine→medicine_delivery |
| 7 | Wedding & Event (SERVICE, `wedding-event`) | wedding-photography→event_media · wedding-videography→event_media · makeup-artist→makeup · mehendi-artist→mehendi · event-decoration→event_decoration |
| 8 | Education (SERVICE, `education`) | home-tutor→home_tutor |
| 9 | Emergency Services (SERVICE, `emergency`) | ambulance→ambulance (isEmergency, allowGuest) |
| 10 | Property (PROPERTY, `property`) | house-flat-rent (RENT: FLAT/HOUSE/ROOM) · office-shop-rent (RENT: OFFICE/SHOP/COMMERCIAL) · land-sale (SALE: LAND) · house-sale (SALE: HOUSE/FLAT) · other-property-sale (SALE: COMMERCIAL/OTHER) |
| 11 | IT & Digital (SERVICE, `it-digital`) | facebook-ads→fb_ads · seo→seo · video-editing · web-development · software-development · graphics-design · influencer-marketing |
| 12 | Custom Request (CUSTOM_REQUEST, `custom-request`) | — (page = custom_request form) |

Each service also gets seeded Bangla `keywords` (e.g. electrician: ইলেকট্রিশিয়ান, বিদ্যুৎ মিস্ত্রি, wiring,
electric mistri), a Bogura-specific intro paragraph, and 3–5 FAQs.
