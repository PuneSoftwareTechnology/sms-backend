# Trainer payment tracker

What we owe each trainer, per student they taught. The mirror image of student
fee collection: a student pays us, we pay the trainer.

## Why trainers are a table

`enrollments.trainer` was free text, so two different people named "Rahul
Sharma" were indistinguishable and their payments could not be separated. The
`trainers` table makes the trainer a real record, and `enrollments.trainer_id`
is what identifies them. **The name is a display label, never an identity.**

`enrollments.trainer` (TEXT) is kept as a denormalized snapshot of the trainer's
name, written whenever `trainer_id` is written. Existing read paths — fee dues,
candidate reports, the enrollment CSV export — keep reading the text column and
needed no changes. It can be retired later, screen by screen.

Keeping that snapshot honest means rewriting it in three places, and missing any
one of them leaves two screens showing different names for the same person:
creating or editing an enrollment, renaming a trainer, and **merging** trainers —
where every enrollment on the survivor is refreshed, not just the ones that
moved, because the survivor's own rows still carry whatever was typed at the
time. The migration normalizes it once for existing rows (step 3b).

### Telling trainers apart

- `trainer_code` (`TRN-001`, …) is assigned by a sequence default, so concurrent
  inserts cannot collide and app code never picks one. It gives humans a short
  unambiguous handle.
- The UI decorates a name with its code only when that name is **ambiguous** —
  see `buildTrainerLabels` in the frontend. A unique name displays clean.
- `note` is optional and only worth filling in to separate two real namesakes.
- Creating a trainer whose name already exists returns **409** unless
  `confirmDuplicate: true`. Most duplicates are re-entries of someone who
  already exists, and silently creating a second record splits their payments
  across two rows nobody notices.
- Genuine spelling variants of one person ("Rahul S" / "Rahul Sharma") are
  merged from the Trainers page. No script guesses at this.

### `courses` is a hint, not a fence

`trainers.courses` is what a trainer is *hired for*. It groups them to the top
of the enrollment dropdown and nothing more — a Java trainer can be assigned a
React course, and the full list always stays selectable. What they are
*actually* teaching is derived from their enrollments and displayed alongside,
so the tags never drift into meaning "everything".

## Money model

One `trainer_payouts` row per enrollment, created on first edit. Rows in the
tracker are driven by **enrollments**, so a newly enrolled student appears
immediately and can never be silently missing from what we owe someone.

```
split1 fee  = training_fee * split1_percent / 100     -- the "1st 50%" column
split2 fee  = training_fee - split1 fee
settled(n)  = installment(n)_amount + installment(n)_tds
balance     = training_fee - settled1 - settled2
```

Two decisions worth stating plainly, both changeable in one place:

- **TDS counts as settled.** It is withheld out of the gross owed, not charged
  on top, so paying ₹9,000 with ₹1,000 TDS discharges ₹10,000. Encoded in
  `SETTLED()` in `trainerPayout.repository.js`.
- **The split is a percentage**, defaulting to 50. An uneven split (60/40) or a
  single full payment (100) needs no schema change, and the "1st/2nd 50% Fees"
  columns stay derived rather than stored.

TDS is stored as a rupee amount, never a rate. The frontend pre-fills it from
`DEFAULT_TDS_PERCENT` as a convenience and the user can overwrite it before
saving, so the stored figure is always the one actually deducted.

### Payment status

Derived from the amounts, with `payment_status` acting as a manual override
when set (that is how `HOLD` is expressed). `NULL` means "derive it".

```
training_fee = 0            -> NOT_SET
settled <= 0                -> UNPAID
settled >= training_fee     -> PAID
otherwise                   -> PARTIAL
```

## Access

Mirrors how master courses already work:

| Action | Endpoint | Roles |
| --- | --- | --- |
| List trainers (dropdown) | `GET /admin/trainers` | ADMIN, SUPER_ADMIN |
| Create / edit / delete / merge | `/super-admin/trainers` | SUPER_ADMIN |
| Payout tracker + edits | `/admin/trainer-payouts` | SUPER_ADMIN |
| Dashboard totals | inside `GET /admin/dashboard/stats` | SUPER_ADMIN |

Trainer payment figures are super-admin only. To open the tracker to admins,
change the `authorizeRoles("SUPER_ADMIN")` calls on those three routes in
`admin.routes.js` and the entries in the frontend's `constants/access.ts`.

Interns are blocked automatically — `internAccess.middleware.js` is an
allow-list, so anything new is denied to them until it is added.

### The dashboard totals

The tracker table carries no summary tiles; the money totals live in the
dashboard's **Trainer Payments** section instead. `dashboard.service.js` omits
the `trainerPayout` key entirely for non-super-admins rather than zeroing it, so
the section is absent rather than misleadingly blank.

That gate needs the role inside the dashboard's **cache key**, which is what
`filters.role` is for: the service caches responses for 30 seconds keyed on the
filters, so without the role a super admin's cached payload — trainer payouts
included — would be handed straight back to the next admin who loaded the page.

Totals are paired the same way as the revenue section: **Paid to Trainers** is
scoped to the selected period (money that actually moved, like revenue
collected), while **Total Payable** and **Balance to Pay** are point-in-time
totals across all periods (like pending dues).

## Migrating

1. `node migrations/survey-trainers.mjs` — **read-only**. Dumps every distinct
   trainer name with its normalized key so the spelling variants a script cannot
   safely merge get reviewed by a human first.
2. `node migrations/add-trainers-and-payouts.mjs` — creates the tables, creates
   one trainer per distinct normalized name, links every enrollment, then
   **verifies zero enrollments were left unlinked** and exits non-zero if any
   were. Only after that check passes does it normalize the `trainer` text
   column to the canonical spelling.

   Canonical spelling = the variant used on the most enrollments, breaking ties
   toward normal capitalisation. Without that tiebreaker a three-way tie between
   `Rahul Sharma`, `rahul  sharma` and `RAHUL SHARMA` resolves alphabetically and
   the trainer reads as `RAHUL SHARMA` in every dropdown from then on.
3. Merge the spelling variants from the Trainers page.

Both scripts are safe to re-run. The only change to existing data is the casing
and spacing of names already in `enrollments.trainer` — step 3b rewrites
`RAHUL SHARMA` to `Rahul Sharma`, never one person's name to another's, since
`trainer_id` was matched on the normalized form. Rolling back is dropping the
two new tables and the new column; the tidied spellings simply remain.
