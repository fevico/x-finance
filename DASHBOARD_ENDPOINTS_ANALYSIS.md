# Dashboard Endpoints Analysis

## Overview
Analysis of what endpoints exist in the backend to support the financial dashboard, what data is missing, and recommendations for implementation.

---

## Dashboard Components & Data Requirements

### 1. **KPI Cards (Top Summary)**
#### Revenue (MTD)
- **Requirement**: Monthly revenue total + month-over-month comparison
- **Status**: ⚠️ **PARTIAL** - Invoice analytics exist but need MTD filtering
- **Existing Endpoint**: 
  - `GET /invoice/analytics` (payment-received.service.ts:1045)
  - Returns: Monthly invoice revenue from 6 months back
  - Issue: Returns ALL paid invoices from 6 months, not just MTD vs previous month

#### Bank Balance
- **Requirement**: Total bank account balance + month-over-month comparison
- **Status**: ⚠️ **MISSING**
- **Available Data**:
  - `GET /banking/accounts` - Lists all bank accounts with balances
  - Each bank account has a `balance` field
  - Need to: Sum all bank account balances + track month-over-month changes

#### Current Liabilities
- **Requirement**: Total unpaid bills + month-over-month comparison
- **Status**: ⚠️ **MISSING**
- **Available Data**:
  - `GET /bills` - Lists all bills with payment status
  - Need to: Filter unpaid/partially paid bills, sum totals, track month-over-month

#### Active Customers
- **Requirement**: Count of active customers + month-over-month comparison
- **Status**: ✅ **AVAILABLE**
- **Existing Method**:
  - `customer.service.ts:33` - `getAllCustomer()` returns `active` count
  - `GET /customer` returns list with total and active counts
  - Issue: No month-over-month tracking (need created_at filtering)

---

### 2. **Revenue & Expenses Chart (Monthly Breakdown)**
#### Data Points
- **Requirement**: Monthly revenue and expenses for 10 months (Jan-Oct)
- **Revenue**: Sum of paid invoices per month
- **Expenses**: Sum of approved expenses per month
- **Status**: ⚠️ **PARTIAL**

#### Revenue (by Month)
- **Existing**: `GET /invoice/analytics` calculates monthly paid invoices
- **Issue**: Returns 6-month history, need to expand to 12 months
- **Service**: `invoice.service.ts:1045` - `getInvoiceAnalytics()`

#### Expenses (by Month)
- **Status**: ❌ **MISSING**
- **Needed**: 
  - Sum of approved expenses grouped by month
  - Sum of paid bills (payment made) grouped by month
  - Create new endpoint: `GET /expenses/analytics` or `GET /analytics/monthly-expenses`

---

### 3. **Cash Flow Chart (Inflow vs Outflow)**
#### Data Points
- **Requirement**: Monthly inflow (revenue) vs outflow (expenses) for 6 months
- **Status**: ❌ **MISSING** - Need composite endpoint

#### Components to Calculate:
1. **Inflow**: 
   - Sum of paid invoices
   - Sum of receipts (if applicable)
   - Sum of bank deposits

2. **Outflow**:
   - Sum of approved expenses
   - Sum of bill payments made
   - Sum of bank withdrawals

#### Recommendation:
- Create endpoint: `GET /analytics/cash-flow`
- Parameters: `from` (date), `to` (date), optional `byPeriod` (daily/weekly/monthly)
- Returns: Array with dates and inflow/outflow amounts

---

### 4. **Top Expenses (Pie Chart)**
#### Data Points
- **Requirement**: Expense breakdown by category (Salaries, Rent, Utilities, Marketing, Other)
- **Status**: ⚠️ **PARTIAL**
- **Existing Data**:
  - Expenses have a `category` field
  - Need to group by category and sum amounts

#### Recommendation:
- Create endpoint: `GET /expenses/by-category`
- Parameters: `from` (date), `to` (date), optional `limit` (top N)
- Returns: Array of categories with total amounts

---

### 5. **Recent Transactions**
#### Data Points
- **Requirement**: Latest 5-10 transactions with type, counterparty, date, amount
- **Status**: ⚠️ **PARTIAL**
- **Available Data Sources**:
  - `GET /account-transaction` - Lists all account transactions
  - `GET /payment-received` - Lists payments received
  - `GET /bills` - Lists bills
  - `GET /expenses` - Lists expenses
  - Issue: Scattered across multiple endpoints, need unified "recent activity"

#### Recommendation:
- **Option 1**: Create endpoint `GET /analytics/recent-transactions`
  - Params: `limit` (default 10), `types` (filter by type)
  - Returns: Merged and sorted list from account transactions
  
- **Option 2**: Use AccountTransaction directly
  - `GET /account-transaction?limit=10&orderBy=date&direction=desc`
  - Already has all data needed (date, description, reference, amounts)

---

### 6. **Accounts Receivable Aging**
#### Data Points
Current (0-30 days): ₦124k, 31-60 days: ₦38k, 61-90 days: ₦12k, 90+ days: ₦8k

- **Status**: ✅ **AVAILABLE**
- **Existing Endpoint**: 
  - `GET /invoice/analytics` (invoice.service.ts:1045)
  - Returns `aging` object with buckets: '0-30', '31-60', '61-90', '90+'
  - ✅ Already calculates properly

---

### 7. **Accounts Payable Aging**
#### Data Points
Current (0-30 days): ₦86k, 31-60 days: ₦24k, 61-90 days: ₦8k, 90+ days: ₦4k

- **Status**: ❌ **MISSING**
- **Need**: Similar to AR Aging but for bills
- **Calculation**:
  - Fetch all unpaid/partially paid bills
  - Group by age (today - dueDate)
  - Sum amounts per bucket

#### Recommendation:
- Create endpoint: `GET /bills/analytics` (similar to invoice analytics)
- Returns: Aging breakdown for payable accounts

---

## Summary of Endpoints

### ✅ AVAILABLE & WORKING (3)
1. `GET /invoice/analytics` - Returns invoice AR aging + monthly revenue
2. `GET /account-transaction/summary/stats` - Debit/credit summary by type
3. `GET /customer` - Returns customer count + active count

### ⚠️ PARTIAL/INCOMPLETE (3)
1. `GET /invoice/analytics` - Need MTD vs previous month comparison logic in frontend
2. `GET /banking/accounts` - Need to sum balances for bank balance KPI
3. `GET /expenses` & `GET /bills` - Need to aggregate for monthly breakdown

### ❌ MISSING (6)
1. **Bank Balance KPI** - Need endpoint for total bank balance + MTD change
2. **Liabilities KPI** - Need endpoint for total unpaid bills + MTD change
3. **Monthly Revenue & Expenses Chart** - Need unified monthly breakdown
4. **Cash Flow Chart** - Need inflow vs outflow by month
5. **Top Expenses by Category** - Need expense breakdown by category
6. **Payable (Bill) Aging** - Need bill aging analysis (0-30, 31-60, etc.)

---

## Implementation Approach

### **Option A: Single Unified Dashboard Endpoint** (Recommended for Performance)
Create one endpoint that returns all dashboard data at once:

```typescript
// File: src/analytics/analytics.controller.ts
@Get('/dashboard')
async getDashboardData(@Req() req, @Query() filters: DashboardFiltersDto) {
  // filters: { from?: date, to?: date, entityId?: string }
  return {
    // KPIs
    kpis: {
      revenue: { mtd: 845200, change: 12.5 },
      bankBalance: { total: 2500000, change: 5.3 },
      liabilities: { total: 482500, change: -2.1 },
      activeCustomers: { count: 127, change: 8.5 }
    },
    
    // Charts
    monthlyRevenue: [...],
    monthlyExpenses: [...],
    cashFlow: [...],
    topExpenses: [...],
    
    // Aging Reports
    receivableAging: {...},
    payableAging: {...},
    
    // Recent Activity
    recentTransactions: [...]
  };
}
```

**Pros**:
- Single API call for entire dashboard
- Better performance
- Easier to cache
- Atomic data consistency

**Cons**:
- Large response payload
- Harder to update individual components

---

### **Option B: Multiple Specialized Endpoints** (More Flexible)
Create separate endpoints for each dashboard section:

```
GET /analytics/kpis?period=mtd
GET /analytics/revenue-expenses?months=10
GET /analytics/cash-flow?from=&to=
GET /analytics/expenses/by-category
GET /analytics/receivable-aging
GET /analytics/payable-aging
GET /analytics/recent-transactions?limit=10
```

**Pros**:
- Frontend loads only needed data
- Easier to update individual components
- Can cache separately
- More granular control

**Cons**:
- Multiple API calls
- Potential inconsistency between calls
- More network overhead

---

## Recommended Implementation Plan

### **Phase 1: Quick Wins (Use existing data)**
1. ✅ Receivable Aging - Already in `/invoice/analytics`
2. 🔄 Bank Balance - Sum bank account balances in new endpoint
3. 🔄 Customer Count - Already in `/customer` endpoint

### **Phase 2: Missing Core Features**
1. Create `GET /bills/analytics` - Bill aging + monthly payable
2. Create `GET /analytics/monthly-breakdown` - Revenue + Expenses by month
3. Create `GET /analytics/cash-flow` - Inflow vs outflow

### **Phase 3: Polish & Optimize**
1. Create `GET /analytics/dashboard` - Unified endpoint (combines all above)
2. Add caching layer for expensive queries
3. Add date range filtering

---

## Code Examples

### Example 1: Bank Balance Endpoint
```typescript
// src/banking/banking.controller.ts
@Get('/analytics/balance')
async getBankBalanceSummary(@Req() req) {
  const entityId = getEffectiveEntityId(req);
  return this.bankingService.getTotalBankBalance(entityId);
}

// src/banking/banking.service.ts
async getTotalBankBalance(entityId: string) {
  const accounts = await this.prisma.bankAccount.findMany({
    where: { entityId },
    select: { balance: true }
  });
  
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  
  // For month-over-month: need to query transactions from last month
  const lastMonthBalance = await this.calculatePreviousMonthBalance(entityId);
  const change = ((totalBalance - lastMonthBalance) / lastMonthBalance) * 100;
  
  return {
    totalBalance,
    previousMonthBalance: lastMonthBalance,
    changePercent: change
  };
}
```

### Example 2: Monthly Revenue & Expenses
```typescript
// src/analytics/analytics.controller.ts
@Get('/monthly-breakdown')
async getMonthlyBreakdown(
  @Req() req,
  @Query('months') months: number = 12
) {
  const entityId = getEffectiveEntityId(req);
  return this.analyticsService.getMonthlyBreakdown(entityId, months);
}

// src/analytics/analytics.service.ts
async getMonthlyBreakdown(entityId: string, months: number) {
  const monthlyData = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date();
    start.setMonth(start.getMonth() - i);
    start.setDate(1);
    
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    
    const month = start.toLocaleString('default', { month: 'short' });
    
    // Revenue: sum paid invoices
    const revenue = await this.prisma.invoice.aggregate({
      where: {
        entityId,
        status: 'Paid',
        invoiceDate: { gte: start, lte: end }
      },
      _sum: { total: true }
    });
    
    // Expenses: sum approved expenses + bill payments
    const expenses = await this.prisma.expense.aggregate({
      where: {
        entityId,
        status: 'Approved',
        createdAt: { gte: start, lte: end }
      },
      _sum: { amount: true }
    });
    
    monthlyData.push({
      month,
      revenue: revenue._sum.total || 0,
      expenses: expenses._sum.amount || 0
    });
  }
  
  return monthlyData;
}
```

### Example 3: Bill Aging Analytics
```typescript
// src/purchases/bills/bills.controller.ts
@Get('/analytics')
async getBillAnalytics(@Req() req) {
  const entityId = getEffectiveEntityId(req);
  return this.billsService.getAnalytics(entityId);
}

// src/purchases/bills/bills.service.ts
async getAnalytics(entityId: string) {
  const now = new Date();
  
  // Fetch all unpaid bills
  const unpaidBills = await this.prisma.bill.findMany({
    where: {
      entityId,
      status: { in: ['Sent', 'Overdue'] }
    },
    select: {
      total: true,
      dueDate: true,
      status: true
    }
  });
  
  const aging = {
    '0-30': 0,
    '31-60': 0,
    '61-90': 0,
    '90+': 0
  };
  
  // Calculate aging buckets
  unpaidBills.forEach(bill => {
    const ageInDays = Math.floor(
      (now.getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (ageInDays <= 30) aging['0-30'] += bill.total;
    else if (ageInDays <= 60) aging['31-60'] += bill.total;
    else if (ageInDays <= 90) aging['61-90'] += bill.total;
    else aging['90+'] += bill.total;
  });
  
  return aging;
}
```

---

## File Structure for New Analytics Module

```
src/
  analytics/
    analytics.controller.ts
    analytics.service.ts
    analytics.module.ts
    dto/
      dashboard-filters.dto.ts
      dashboard-response.dto.ts
      kpi.dto.ts
      monthly-breakdown.dto.ts
      cash-flow.dto.ts
```

---

## Next Steps

1. **Review** this analysis with frontend team
2. **Decide** between Option A (single endpoint) vs Option B (multiple endpoints)
3. **Prioritize** which dashboard components are most urgent
4. **Implement** Phase 1 quick wins first
5. **Test** endpoints with actual data
6. **Document** with Swagger/OpenAPI specifications

---

## Notes

- All calculations should respect `entityId` for multi-tenant support
- Add proper date-range filtering from the start
- Consider caching expensive aggregations (Redis recommended)
- Archive old data strategy to prevent query slowdown
- Add debug logging for performance monitoring
