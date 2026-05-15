# BuildTrack — Manual Testing Guide

Use this document to verify all app functionality end-to-end. Each section covers one feature area. Work through the steps in order where noted, as some tests build on earlier state (e.g., you need a project before you can add expenses to it).

Mark each item **Pass**, **Fail**, or **N/A** as you go.

---

## 1. Authentication & Onboarding

### 1.1 Signup
| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Navigate to the app root URL while logged out | Login screen appears | |
| 2 | Click "Create an account" | Signup form appears | |
| 3 | Submit with all fields empty | Validation errors shown | |
| 4 | Submit with mismatched passwords | "Passwords do not match" error shown | |
| 5 | Complete signup with a new email + strong password | Redirected to Company Setup screen | |
| 6 | Enter a company name and submit | Redirected to Dashboard | |

### 1.2 Login
| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Log out (via sidebar or settings) | Returned to login screen | |
| 2 | Submit login with wrong password | Error message shown, not logged in | |
| 3 | Submit login with correct credentials | Redirected to Dashboard | |
| 4 | Refresh the page while logged in | Session persists, Dashboard reloads | |

---

## 2. Dashboard

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Navigate to Dashboard | Page loads without errors | |
| 2 | Verify KPI cards are present | Total Budget, Actual Spend, Variance, Active Projects all show values | |
| 3 | Verify Variance card color | Green when under budget, red when over | |
| 4 | Check "Tasks Due Soon" list | Shows tasks due within 7 days that are not marked Done | |
| 5 | Check "Recent Expenses" list | Shows the 5 most recently dated expenses | |
| 6 | Add a new project + expense (via Projects) and return to Dashboard | KPI values update to reflect new data | |

---

## 3. Projects

### 3.1 Project List
| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Navigate to Projects | Project list loads | |
| 2 | Click "New Project" | Create project form opens | |
| 3 | Submit form with no project name | Validation error shown | |
| 4 | Fill in name + status and submit | New project appears in the list | |
| 5 | Click on a project card | Project Detail view opens | |

### 3.2 Project Detail — Overview Tab
| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Open a project with tasks and expenses | Overview tab loads by default | |
| 2 | Verify KPI snapshot cards | Budget, Spend, Variance, task counts displayed | |
| 3 | Verify recent tasks list | Up to 5 most recent tasks shown | |
| 4 | Verify recent expenses list | Up to 5 most recent expenses shown, amounts to nearest cent | |

### 3.3 Project Detail — Tasks Tab
| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Click the Tasks tab | Task list loads | |
| 2 | Click "Add Task" | Task form appears | |
| 3 | Submit with no title | Validation error shown | |
| 4 | Fill in title, status, due date and submit | Task appears in the list | |
| 5 | Click "Edit" on a task | Edit form pre-filled with task data | |
| 6 | Change the status and save | Task updates in list | |
| 7 | Click "Delete task" in edit form | Confirmation prompt appears | |
| 8 | Confirm delete | Task removed from list | |

### 3.4 Project Detail — Expenses Tab
| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Click the Expenses tab | Expense list loads, sorted by most recent date | |
| 2 | Verify total spend shown in card header | Total is sum of all expense amounts | |
| 3 | Click "Add Expense" | Expense form appears | |
| 4 | Submit with required fields missing | Validation highlights missing fields in red | |
| 5 | Click "Manage categories" link | Category modal opens | |
| 6 | Close modal and select a vendor, category, amount, date, description | All fields populated | |
| 7 | Submit | New expense appears at top of list (most recent) | |
| 8 | Click "Edit" on an expense | Edit form pre-filled | |
| 9 | Change amount and save | Expense updates, total in header recalculates | |
| 10 | Delete the expense | Expense removed, total updates | |
| 11 | Amounts in the list | All amounts show to nearest cent (e.g. $1,234.56) | |

### 3.5 Project Detail — Budget Tab
| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Click the Budget tab | KPI cards and line items list load | |
| 2 | Click "Add Line Item" | Line item form appears | |
| 3 | Click "Manage categories" link | Category modal opens | |
| 4 | Select a category, description, budgeted amount and submit | Line item appears in list | |
| 5 | Verify progress bar | Shows actual spend vs. budgeted amount | |
| 6 | Add expenses that exceed the line item budget | Progress bar turns red, "Over budget" indicated | |
| 7 | Click "Add Quote" on a line item | Quote form appears | |
| 8 | Fill in vendor, amount, submitted date and submit | Quote appears under line item | |
| 9 | Click "Award" on a quote | Quote status changes to Awarded | |
| 10 | Edit a quote and save | Quote updates | |
| 11 | Delete a quote | Quote removed | |
| 12 | Edit a line item and save | Line item updates | |
| 13 | Delete a line item | Line item + its quotes removed | |
| 14 | Verify KPI row at top | Project Budget Total, Line Items Total, Awarded Quotes, Actual Spend all correct | |

### 3.6 Project Detail — Documents Tab
| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Click the Documents tab | Documents list and upload zone load | |
| 2 | Drag and drop a file onto the upload zone | Upload form opens with filename pre-filled | |
| 3 | Fill in title, type, notes and click Upload | Progress bar shown during upload; document appears in list | |
| 4 | Click "Upload File" button | File browser opens | |
| 5 | Select a file, fill in details and upload | Document appears in list | |
| 6 | Click "Download" on a document | File downloads or opens in new tab | |
| 7 | Click "Delete" on a document | Confirmation prompt appears | |
| 8 | Confirm delete | Document removed from list | |
| 9 | Try uploading a file > 50 MB | Error: "File exceeds 50 MB limit" | |

### 3.7 Project Detail — Settings Tab
| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Click the Settings tab | Project details form loads with current values | |
| 2 | Change the project name and click "Save Changes" | Success message shown, project name updates in header | |
| 3 | Change status, dates, budget total, notes and save | All fields persist | |
| 4 | Click "Delete Project" in Danger Zone | Confirmation prompt appears | |
| 5 | Cancel the deletion | Project not deleted | |
| 6 | Create a test project, then confirm deletion | Project removed, redirected to Projects list | |

---

## 4. Global Tasks

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Navigate to Tasks | All tasks across all projects listed | |
| 2 | Filter by a specific project | Only that project's tasks shown | |
| 3 | Filter by status (e.g. "Blocked") | Only blocked tasks shown | |
| 4 | Filter by from/to date range | Only tasks with due dates in range shown | |
| 5 | Clear filters | All tasks return | |
| 6 | Click "Add Task" | Task form opens | |
| 7 | Select a project, fill in title, status, due date and submit | Task appears in list | |
| 8 | Edit a task from this view | Task updates | |
| 9 | Delete a task | Task removed | |

---

## 5. Global Expenses

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Navigate to Expenses | All expenses across all projects listed, sorted by most recent date | |
| 2 | Filter by a specific project | Only that project's expenses shown | |
| 3 | Filter by a category | Only expenses in that category shown | |
| 4 | Filter by date range | Only expenses within the range shown | |
| 5 | Clear all filters | All expenses return | |
| 6 | Click "Add Expense" | Expense form opens | |
| 7 | In the form, click "Manage categories" | Category modal opens (see Section 6) | |
| 8 | Fill in all required fields and submit | Expense appears in list | |
| 9 | Edit an expense | Expense updates | |
| 10 | Delete an expense | Expense removed | |
| 11 | Verify total at bottom of list | Equals sum of visible (filtered) expenses | |

---

## 6. Category Management

Access via the "Manage categories" link under any category dropdown in the expense or budget line item forms.

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Click "Manage categories" in any form | Modal opens with alphabetical list of categories | |
| 2 | Type a new category name and click Add (or press Enter) | Category added to list, sorted alphabetically | |
| 3 | Click "Rename" on a category | Inline input field appears with current name | |
| 4 | Change the name and press Enter (or click away) | Category name updated in list and in all dropdowns | |
| 5 | Press Escape during rename | Edit cancelled, name unchanged | |
| 6 | Click "Delete" on a category with no expenses or line items | Category removed from list | |
| 7 | Click "Delete" on a category that is in use | Usage message shown: "Used by N expenses and M budget line items. Update those before deleting." — category not deleted | |
| 8 | Click outside the modal | Modal closes | |
| 9 | Click ✕ button | Modal closes | |
| 10 | After adding a category, close modal and open expense form | New category appears in the dropdown | |

---

## 7. Vendors

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Navigate to Vendors | Vendor list loads with spend summaries | |
| 2 | Click "Add Vendor" | Vendor form opens | |
| 3 | Submit with no name | Validation error shown | |
| 4 | Fill in name, trade, contact info and submit | Vendor appears in list | |
| 5 | Click "Edit" on a vendor | Edit form pre-filled | |
| 6 | Update a field and save | Vendor updates | |
| 7 | Click "Delete" on a vendor | Confirmation prompt appears | |
| 8 | Confirm delete | Vendor removed | |
| 9 | Set a date range filter | Total spend per vendor reflects only expenses in that range | |
| 10 | Click on a vendor to expand spend detail | Per-project spend breakdown shown | |

---

## 8. Reports

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Navigate to Reports | Wizard builder loads | |
| 2 | Select "Report By: Project" | Project dropdown appears | |
| 3 | Select a project | Date Range dropdown appears | |
| 4 | Select "This Year" | Generate button becomes active | |
| 5 | Click "Generate Report" | Report table renders with KPI cards (selected item, total spend, expense count) | |
| 6 | Click a column header to sort | Rows re-sort by that column; click again to reverse | |
| 7 | Change the Report By to "Vendor" without regenerating | Stale report warning banner appears | |
| 8 | Click "Regenerate Report" | Report updates with new parameters | |
| 9 | Select "Custom Range", enter start and end dates, regenerate | Report scoped to custom date range | |
| 10 | Generate a report with no matching expenses | "No expenses found" message shown | |
| 11 | Click "Export CSV" | CSV file downloads with correct filename and data | |
| 12 | Click "Print / PDF" | Browser print dialog opens with print-optimized layout | |
| 13 | Repeat steps 2–6 for "Report By: Vendor" | Vendor-specific columns shown in table | |
| 14 | Repeat steps 2–6 for "Report By: Category" | Category-specific columns shown in table | |

---

## 9. Documents (Global)

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Navigate to Documents | Global document list and upload zone load | |
| 2 | Upload a file and assign it to a project | Document appears in list with project name | |
| 3 | Filter by project | Only that project's documents shown | |
| 4 | Filter by document type | Only documents of that type shown | |
| 5 | Download a document | File downloads or opens in new tab | |
| 6 | Delete a document | Confirmation prompt; document removed on confirm | |
| 7 | Upload a file with no project assigned | Document appears tagged as general (no project) | |

---

## 10. Settings

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Navigate to Settings | Company name and account email displayed | |
| 2 | Click "Edit" next to company name | Input field appears pre-filled | |
| 3 | Clear the field and click Save | Validation prevents save (empty not allowed) | |
| 4 | Enter a new company name and save | Success message shown, company name updated | |
| 5 | Cancel edit | Company name reverts to previous value | |
| 6 | Verify account email | Displays the logged-in user's email (read-only) | |

---

## 11. Multi-tenancy & Data Isolation

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Sign up with a second account (different email) | Second company created independently | |
| 2 | Create projects, expenses, vendors in the second account | Data saves successfully | |
| 3 | Log back in as the first account | First account data is unchanged; second account's data is not visible | |

---

## 12. Edge Cases & Error Handling

| # | Scenario | Expected Result | Result |
|---|----------|-----------------|--------|
| 1 | Add an expense with amount $0 | Allowed (zero-dollar expenses are valid) | |
| 2 | Add an expense with a future date | Allowed | |
| 3 | Enter a very long project name (200+ chars) | Saved and displayed (may truncate in UI) | |
| 4 | Disconnect from the internet, attempt to save | Error message shown; no data lost | |
| 5 | Navigate directly to `/projects/invalid-id` | "Project not found" error displayed | |
| 6 | Open the app in two browser tabs, create a project in one | Second tab shows stale data until refreshed | |
