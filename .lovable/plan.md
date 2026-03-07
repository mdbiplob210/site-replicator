

## Advanced Order Filtering System

Based on the reference image, I'll replace the existing date filter and header date filter with a collapsible "Filtering" panel that has multiple filter fields — all connected to the database for real-time, no-refresh filtering.

### What Gets Removed
- The "Date Filter" popover button in the header (lines 476-488)
- The date filter bar below search (lines 686-754)

### What Gets Added

A collapsible `Accordion`-based "Filtering" section (using existing Accordion component) placed between the status tabs and the search bar. It will contain a grid of filter fields:

**Row 1 — Date Filters:**
- **Order Created At** — Select dropdown (Today, Yesterday, Last 7 Days, Last 30 Days, Custom Range) with calendar pickers for custom range
- **Status Added At** — Optional date range filter

**Row 2 — Core Filters:**
- **Status** — Text input to filter by status name
- **Order Source** — Input field filtering by `source` column
- **Phone** — Input to search by `customer_phone`

**Row 3 — Product & Amount Filters:**
- **Search Product** — Input filtering orders that contain a specific product (via `order_items` join or client-side)
- **Product Amount Min** — Numeric input for minimum `total_amount`
- **Product Amount Max** — Numeric input for maximum `total_amount`

**Row 4 — Tracking Filters:**
- **Courier Status** — Select dropdown (All, Pending, Delivered, etc.) via `courier_orders` table
- **Device Type** — Select (All, Mobile, Desktop, Tablet) from `device_info` column

**Bottom Action Bar:**
- Clear Filter button
- Order Sources button (shows unique sources summary)
- Duplicate Orders button (links to incomplete orders with IP blocked filter)

### Technical Approach

1. **All filtering happens client-side on already-fetched data** for instant, no-refresh results. The date filter will remain server-side (via `useOrders` hook) since it controls the query range.

2. **New state variables** for each filter field (source, phone, amount min/max, device type, courier status).

3. **Enhanced `filteredOrders` memo** — extend the existing `useMemo`/filter logic to apply all active filters simultaneously.

4. **For amount range filtering** — compare `total_amount` against min/max values.

5. **For source filtering** — match against the `source` column.

6. **For device filtering** — parse `device_info` field.

7. **Collapsible UI** — Use `Collapsible` component from radix so the filter panel can be toggled open/closed, keeping the UI clean when not in use.

### Files to Edit
- **`src/pages/admin/AdminOrders.tsx`** — Remove old date filters, add new collapsible filtering panel with all fields, extend filter logic in `filteredOrders`

### Design Style
- Matches existing rounded-xl, border-border/60 design language
- Grid layout: 4 columns on desktop, 2 on mobile
- Purple/primary accent for active filter dropdowns (matching reference image)
- Filter count badge showing number of active filters
- Smooth transitions, no page refresh needed

