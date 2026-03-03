# Dashboard Analytics API - Frontend Integration Guide

## Overview

The analytics API provides a unified endpoint (`GET /analytics/dashboard`) that returns all dashboard data with comprehensive filtering capabilities. You can also consume individual chart endpoints for more granular control.

---

## Date Filter Options

All chart data supports these filter options:

| Filter | Description | Date Range |
|--------|-------------|------------|
| `THIS_YEAR` | January 1 to Today | Current calendar year |
| `THIS_FISCAL_YEAR` | Fiscal year start to today | Configured per entity (currently Jan 1 - Dec 31) |
| `LAST_FISCAL_YEAR` | Previous fiscal year (full) | Previous 12-month fiscal cycle |
| `LAST_12_MONTHS` | Last 12 months from today | 12 months ago to today |

**Note**: Fiscal year is currently a placeholder (Jan 1 - Dec 31). It will be configurable per entity in the future.

---

## Endpoint Reference

### 1. **GET /analytics/dashboard** (RECOMMENDED)
Get all dashboard data in a single call.

#### Request
```http
GET /analytics/dashboard?monthlyFilter=THIS_YEAR&cashFlowFilter=LAST_12_MONTHS&expensesFilter=THIS_YEAR
Authorization: Bearer {token}
```

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `monthlyFilter` | enum | THIS_YEAR | Filter for bar chart (Revenue & Expenses by Month) |
| `cashFlowFilter` | enum | LAST_12_MONTHS | Filter for line chart (Inflow vs Outflow) |
| `expensesFilter` | enum | THIS_YEAR | Filter for pie chart (Top Expenses by Category) |

#### Response
```json
{
  "kpis": {
    "revenue": {
      "mtd": 845200,
      "change": 45200,
      "changePercent": 12.5
    },
    "bankBalance": {
      "total": 2500000,
      "change": 125000,
      "changePercent": 5.3
    },
    "liabilities": {
      "total": 482500,
      "change": -9500,
      "changePercent": -2.1
    },
    "activeCustomers": {
      "count": 127,
      "change": 10,
      "changePercent": 8.5
    }
  },
  "monthlyBreakdown": [
    {
      "month": "Jan '25",
      "revenue": 750000,
      "expenses": 450000
    },
    {
      "month": "Feb '25",
      "revenue": 820000,
      "expenses": 480000
    }
  ],
  "cashFlow": [
    {
      "month": "Jan '25",
      "inflow": 750000,
      "outflow": 450000
    },
    {
      "month": "Feb '25",
      "inflow": 820000,
      "outflow": 480000
    }
  ],
  "topExpenses": [
    {
      "category": "Salaries",
      "amount": 180000,
      "percentage": 42.5
    },
    {
      "category": "Rent",
      "amount": 85000,
      "percentage": 20.1
    },
    {
      "category": "Utilities",
      "amount": 42000,
      "percentage": 9.9
    },
    {
      "category": "Marketing",
      "amount": 68000,
      "percentage": 16.0
    },
    {
      "category": "Other",
      "amount": 95000,
      "percentage": 11.5
    }
  ],
  "receivableAging": {
    "0-30": 124000,
    "31-60": 38000,
    "61-90": 12000,
    "90+": 8000
  },
  "payableAging": {
    "0-30": 86000,
    "31-60": 24000,
    "61-90": 8000,
    "90+": 4000
  },
  "recentTransactions": [
    {
      "id": "tx-001",
      "date": "2025-11-10T14:30:00Z",
      "description": "Invoice Payment - Acme Corp",
      "reference": "INV-001",
      "type": "INVOICE_POSTING",
      "debit": 125000,
      "credit": 0,
      "amount": 125000,
      "status": "Success"
    },
    {
      "id": "tx-002",
      "date": "2025-11-09T10:15:00Z",
      "description": "Office Supplies - Supply Co",
      "reference": "EXP-002",
      "type": "EXPENSE_POSTING",
      "debit": 8500,
      "credit": 0,
      "amount": 8500,
      "status": "Success"
    }
  ]
}
```

---

### 2. **GET /analytics/monthly-breakdown**
Get monthly revenue and expenses for bar chart.

#### Request
```http
GET /analytics/monthly-breakdown?filter=THIS_YEAR
Authorization: Bearer {token}
```

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `filter` | enum | THIS_YEAR | Date filter (THIS_YEAR, THIS_FISCAL_YEAR, LAST_FISCAL_YEAR, LAST_12_MONTHS) |

#### Response
```json
[
  {
    "month": "Jan '25",
    "revenue": 750000,
    "expenses": 450000
  },
  {
    "month": "Feb '25",
    "revenue": 820000,
    "expenses": 480000
  },
  {
    "month": "Mar '25",
    "revenue": 900000,
    "expenses": 520000
  }
]
```

---

### 3. **GET /analytics/cash-flow**
Get inflow vs outflow for line chart.

#### Request
```http
GET /analytics/cash-flow?filter=LAST_12_MONTHS
Authorization: Bearer {token}
```

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `filter` | enum | LAST_12_MONTHS | Date filter (THIS_YEAR, THIS_FISCAL_YEAR, LAST_FISCAL_YEAR, LAST_12_MONTHS) |

#### Response
```json
[
  {
    "month": "Jan '25",
    "inflow": 750000,
    "outflow": 450000
  },
  {
    "month": "Feb '25",
    "inflow": 820000,
    "outflow": 480000
  }
]
```

---

### 4. **GET /analytics/expenses/by-category**
Get top expenses by category for pie chart.

#### Request
```http
GET /analytics/expenses/by-category?filter=THIS_YEAR&limit=10
Authorization: Bearer {token}
```

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `filter` | enum | THIS_YEAR | Date filter (THIS_YEAR, THIS_FISCAL_YEAR, LAST_FISCAL_YEAR, LAST_12_MONTHS) |
| `limit` | number | 10 | Maximum categories to return |

#### Response
```json
[
  {
    "category": "Salaries",
    "amount": 180000,
    "percentage": 42.5
  },
  {
    "category": "Rent",
    "amount": 85000,
    "percentage": 20.1
  },
  {
    "category": "Utilities",
    "amount": 42000,
    "percentage": 9.9
  }
]
```

---

### 5. **GET /analytics/kpis**
Get KPI cards data only.

#### Request
```http
GET /analytics/kpis
Authorization: Bearer {token}
```

#### Response
```json
{
  "revenue": {
    "mtd": 845200,
    "change": 45200,
    "changePercent": 12.5
  },
  "bankBalance": {
    "total": 2500000,
    "change": 125000,
    "changePercent": 5.3
  },
  "liabilities": {
    "total": 482500,
    "change": -9500,
    "changePercent": -2.1
  },
  "activeCustomers": {
    "count": 127,
    "change": 10,
    "changePercent": 8.5
  }
}
```

---

### 6. **GET /analytics/receivable-aging**
Get AR aging data.

#### Request
```http
GET /analytics/receivable-aging
Authorization: Bearer {token}
```

#### Response
```json
{
  "0-30": 124000,
  "31-60": 38000,
  "61-90": 12000,
  "90+": 8000
}
```

---

### 7. **GET /analytics/payable-aging**
Get AP aging data.

#### Request
```http
GET /analytics/payable-aging
Authorization: Bearer {token}
```

#### Response
```json
{
  "0-30": 86000,
  "31-60": 24000,
  "61-90": 8000,
  "90+": 4000
}
```

---

### 8. **GET /analytics/recent-transactions**
Get recent activity.

#### Request
```http
GET /analytics/recent-transactions
Authorization: Bearer {token}
```

#### Response
```json
[
  {
    "id": "tx-001",
    "date": "2025-11-10T14:30:00Z",
    "description": "Invoice Payment - Acme Corp",
    "reference": "INV-001",
    "type": "INVOICE_POSTING",
    "debit": 125000,
    "credit": 0,
    "amount": 125000,
    "status": "Success"
  }
]
```

---

## Frontend Implementation Examples

### JavaScript/TypeScript - Fetch All Dashboard Data

```typescript
interface DashboardFilters {
  monthlyFilter?: 'THIS_YEAR' | 'THIS_FISCAL_YEAR' | 'LAST_FISCAL_YEAR' | 'LAST_12_MONTHS';
  cashFlowFilter?: 'THIS_YEAR' | 'THIS_FISCAL_YEAR' | 'LAST_FISCAL_YEAR' | 'LAST_12_MONTHS';
  expensesFilter?: 'THIS_YEAR' | 'THIS_FISCAL_YEAR' | 'LAST_FISCAL_YEAR' | 'LAST_12_MONTHS';
}

async function fetchDashboardData(filters: DashboardFilters = {}) {
  const params = new URLSearchParams();
  
  if (filters.monthlyFilter) params.append('monthlyFilter', filters.monthlyFilter);
  if (filters.cashFlowFilter) params.append('cashFlowFilter', filters.cashFlowFilter);
  if (filters.expensesFilter) params.append('expensesFilter', filters.expensesFilter);

  const response = await fetch(`/analytics/dashboard?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  return await response.json();
}

// Usage
const dashboardData = await fetchDashboardData({
  monthlyFilter: 'THIS_YEAR',
  cashFlowFilter: 'LAST_12_MONTHS',
  expensesFilter: 'THIS_YEAR',
});
```

---

### React Component - Dashboard Implementation

```typescript
import React, { useState, useEffect } from 'react';
import { BarChart, LineChart, PieChart } from 'your-chart-library';

type FilterOption = 'THIS_YEAR' | 'THIS_FISCAL_YEAR' | 'LAST_FISCAL_YEAR' | 'LAST_12_MONTHS';

interface DashboardState {
  filters: {
    monthly: FilterOption;
    cashFlow: FilterOption;
    expenses: FilterOption;
  };
  data: any;
  loading: boolean;
  error: string | null;
}

export function Dashboard() {
  const [state, setState] = useState<DashboardState>({
    filters: {
      monthly: 'THIS_YEAR',
      cashFlow: 'LAST_12_MONTHS',
      expenses: 'THIS_YEAR',
    },
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const params = new URLSearchParams({
          monthlyFilter: state.filters.monthly,
          cashFlowFilter: state.filters.cashFlow,
          expensesFilter: state.filters.expenses,
        });

        const response = await fetch(`/analytics/dashboard?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to load dashboard');

        const data = await response.json();
        setState((prev) => ({ ...prev, data, loading: false }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false,
        }));
      }
    };

    loadDashboard();
  }, [state.filters]);

  if (state.loading) return <div>Loading...</div>;
  if (state.error) return <div>Error: {state.error}</div>;

  const { data } = state;

  return (
    <div className="dashboard">
      {/* KPI Cards */}
      <div className="kpi-section">
        <KPICard
          title="Revenue (MTD)"
          value={`₦${data.kpis.revenue.mtd.toLocaleString()}`}
          change={data.kpis.revenue.changePercent}
          icon="dollar"
        />
        <KPICard
          title="Bank Balance"
          value={`₦${data.kpis.bankBalance.total.toLocaleString()}`}
          change={data.kpis.bankBalance.changePercent}
          icon="bank"
        />
        <KPICard
          title="Current Liabilities"
          value={`₦${data.kpis.liabilities.total.toLocaleString()}`}
          change={data.kpis.liabilities.changePercent}
          icon="warning"
        />
        <KPICard
          title="Active Customers"
          value={data.kpis.activeCustomers.count.toString()}
          change={data.kpis.activeCustomers.changePercent}
          icon="users"
        />
      </div>

      {/* Charts */}
      <div className="charts-section">
        {/* Bar Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Revenue & Expenses</h3>
            <select
              value={state.filters.monthly}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  filters: { ...prev.filters, monthly: e.target.value as FilterOption },
                }))
              }
            >
              <option value="THIS_YEAR">This Year</option>
              <option value="THIS_FISCAL_YEAR">This Fiscal Year</option>
              <option value="LAST_FISCAL_YEAR">Last Fiscal Year</option>
              <option value="LAST_12_MONTHS">Last 12 Months</option>
            </select>
          </div>
          <BarChart
            data={data.monthlyBreakdown}
            dataKeys={['revenue', 'expenses']}
            colors={['#4CAF50', '#FF9800']}
          />
        </div>

        {/* Line Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Cash Flow</h3>
            <select
              value={state.filters.cashFlow}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  filters: { ...prev.filters, cashFlow: e.target.value as FilterOption },
                }))
              }
            >
              <option value="THIS_YEAR">This Year</option>
              <option value="THIS_FISCAL_YEAR">This Fiscal Year</option>
              <option value="LAST_FISCAL_YEAR">Last Fiscal Year</option>
              <option value="LAST_12_MONTHS">Last 12 Months</option>
            </select>
          </div>
          <LineChart data={data.cashFlow} dataKeys={['inflow', 'outflow']} />
        </div>

        {/* Pie Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Top Expenses</h3>
            <select
              value={state.filters.expenses}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  filters: { ...prev.filters, expenses: e.target.value as FilterOption },
                }))
              }
            >
              <option value="THIS_YEAR">This Year</option>
              <option value="THIS_FISCAL_YEAR">This Fiscal Year</option>
              <option value="LAST_FISCAL_YEAR">Last Fiscal Year</option>
              <option value="LAST_12_MONTHS">Last 12 Months</option>
            </select>
          </div>
          <PieChart
            data={data.topExpenses}
            dataKey="amount"
            nameKey="category"
            colors={['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']}
          />
        </div>
      </div>

      {/* Aging Reports */}
      <div className="aging-section">
        <AgingChart
          title="Accounts Receivable"
          data={data.receivableAging}
          color="green"
        />
        <AgingChart title="Accounts Payable" data={data.payableAging} color="red" />
      </div>

      {/* Recent Transactions */}
      <div className="recent-transactions">
        <h3>Recent Transactions</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Reference</th>
              <th>Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.recentTransactions.map((tx) => (
              <tr key={tx.id}>
                <td>{new Date(tx.date).toLocaleDateString()}</td>
                <td>{tx.description}</td>
                <td>{tx.reference}</td>
                <td>{tx.type}</td>
                <td>₦{tx.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

### Vue.js Component Example

```vue
<template>
  <div class="dashboard">
    <!-- KPI Cards -->
    <div class="kpi-grid">
      <KPICard
        title="Revenue (MTD)"
        :value="`₦${data.kpis.revenue.mtd.toLocaleString()}`"
        :change="data.kpis.revenue.changePercent"
        icon="dollar"
      />
      <KPICard
        title="Bank Balance"
        :value="`₦${data.kpis.bankBalance.total.toLocaleString()}`"
        :change="data.kpis.bankBalance.changePercent"
        icon="bank"
      />
      <KPICard
        title="Current Liabilities"
        :value="`₦${data.kpis.liabilities.total.toLocaleString()}`"
        :change="data.kpis.liabilities.changePercent"
        icon="warning"
      />
      <KPICard
        title="Active Customers"
        :value="data.kpis.activeCustomers.count"
        :change="data.kpis.activeCustomers.changePercent"
        icon="users"
      />
    </div>

    <!-- Bar Chart -->
    <div class="chart-container">
      <div class="chart-header">
        <h3>Revenue & Expenses</h3>
        <select v-model="filters.monthly">
          <option value="THIS_YEAR">This Year</option>
          <option value="THIS_FISCAL_YEAR">This Fiscal Year</option>
          <option value="LAST_FISCAL_YEAR">Last Fiscal Year</option>
          <option value="LAST_12_MONTHS">Last 12 Months</option>
        </select>
      </div>
      <BarChart :chart-data="monthlyChartData" :options="chartOptions" />
    </div>

    <!-- Line Chart -->
    <div class="chart-container">
      <div class="chart-header">
        <h3>Cash Flow</h3>
        <select v-model="filters.cashFlow">
          <option value="THIS_YEAR">This Year</option>
          <option value="THIS_FISCAL_YEAR">This Fiscal Year</option>
          <option value="LAST_FISCAL_YEAR">Last Fiscal Year</option>
          <option value="LAST_12_MONTHS">Last 12 Months</option>
        </select>
      </div>
      <LineChart :chart-data="cashFlowChartData" :options="chartOptions" />
    </div>

    <!-- Pie Chart -->
    <div class="chart-container">
      <div class="chart-header">
        <h3>Top Expenses</h3>
        <select v-model="filters.expenses">
          <option value="THIS_YEAR">This Year</option>
          <option value="THIS_FISCAL_YEAR">This Fiscal Year</option>
          <option value="LAST_FISCAL_YEAR">Last Fiscal Year</option>
          <option value="LAST_12_MONTHS">Last 12 Months</option>
        </select>
      </div>
      <PieChart :chart-data="expenseChartData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { BarChart, LineChart, PieChart } from 'some-chart-lib';

const filters = ref({
  monthly: 'THIS_YEAR' as const,
  cashFlow: 'LAST_12_MONTHS' as const,
  expenses: 'THIS_YEAR' as const,
});

const data = ref({
  kpis: {},
  monthlyBreakdown: [],
  cashFlow: [],
  topExpenses: [],
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
};

async function loadDashboard() {
  const params = new URLSearchParams({
    monthlyFilter: filters.value.monthly,
    cashFlowFilter: filters.value.cashFlow,
    expensesFilter: filters.value.expenses,
  });

  const response = await fetch(`/analytics/dashboard?${params}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  data.value = await response.json();
}

const monthlyChartData = computed(() => ({
  labels: data.value.monthlyBreakdown.map((d) => d.month),
  datasets: [
    {
      label: 'Revenue',
      data: data.value.monthlyBreakdown.map((d) => d.revenue),
      backgroundColor: '#4CAF50',
    },
    {
      label: 'Expenses',
      data: data.value.monthlyBreakdown.map((d) => d.expenses),
      backgroundColor: '#FF9800',
    },
  ],
}));

const cashFlowChartData = computed(() => ({
  labels: data.value.cashFlow.map((d) => d.month),
  datasets: [
    {
      label: 'Inflow',
      data: data.value.cashFlow.map((d) => d.inflow),
      borderColor: '#4CAF50',
    },
    {
      label: 'Outflow',
      data: data.value.cashFlow.map((d) => d.outflow),
      borderColor: '#FF9800',
    },
  ],
}));

const expenseChartData = computed(() => ({
  labels: data.value.topExpenses.map((d) => d.category),
  datasets: [
    {
      data: data.value.topExpenses.map((d) => d.amount),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
    },
  ],
}));

watch(filters, loadDashboard, { deep: true });

onMounted(loadDashboard);
</script>

<style scoped>
.dashboard {
  display: grid;
  gap: 2rem;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.chart-container {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.chart-header select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

---

## Key Implementation Notes

### 1. **Single Dashboard Endpoint** (Recommended)
Use `GET /analytics/dashboard` for best performance:
- Single API call loads all data
- Data is atomic and consistent
- Easier to cache

### 2. **Individual Endpoints** (For specific needs)
Use individual endpoints if you need:
- Only specific charts
- Real-time filtering without reloading entire dashboard
- More granular caching

### 3. **Filter Handling**
```typescript
// Frontend should store filter selections
const selectedFilters = {
  monthlyFilter: 'THIS_YEAR',        // Bar chart filter
  cashFlowFilter: 'LAST_12_MONTHS',  // Line chart filter
  expensesFilter: 'THIS_YEAR',       // Pie chart filter
};

// When user changes filter, pass to API
const response = await fetch(
  `/analytics/dashboard?monthlyFilter=${selectedFilters.monthlyFilter}&...`
);
```

### 4. **Data Transformation**
Most charting libraries expect data in specific formats:

```typescript
// For Recharts (React)
const barChartData = data.monthlyBreakdown.map(item => ({
  name: item.month,
  revenue: item.revenue,
  expenses: item.expenses,
}));

// For Chart.js
const chartjsData = {
  labels: data.monthlyBreakdown.map(d => d.month),
  datasets: [
    {
      label: 'Revenue',
      data: data.monthlyBreakdown.map(d => d.revenue),
      backgroundColor: '#4CAF50',
    },
  ],
};
```

### 5. **Error Handling**
```typescript
try {
  const response = await fetch('/analytics/dashboard', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  if (response.status === 401) {
    // Redirect to login
  }
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
} catch (error) {
  // Show error toast/snackbar to user
  console.error('Dashboard load failed:', error);
}
```

### 6. **Loading States**
```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

async function loadDashboard() {
  setLoading(true);
  setError(null);
  
  try {
    const data = await fetch('/analytics/dashboard');
    setDashboardData(data);
  } catch (err) {
    setError('Failed to load dashboard');
  } finally {
    setLoading(false);
  }
}
```

---

## Filter Selection Guide

| Use Case | Filter | Reason |
|----------|--------|--------|
| Show performance from start of year | THIS_YEAR | Latest complete data |
| Compare to previous fiscal cycle | LAST_FISCAL_YEAR | Apples-to-apples comparison |
| Track momentum over time | LAST_12_MONTHS | Smoothest trend line |
| Executive review | THIS_FISCAL_YEAR | Official reporting period |

---

## Caching Recommendations

Since the API can be expensive to compute (multiple database queries), consider:

```typescript
// Simple in-memory cache
const dashboardCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getDashboardDataCached(filters) {
  const cacheKey = JSON.stringify(filters);
  const cached = dashboardCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetch(`/analytics/dashboard?${new URLSearchParams(filters)}`);
  dashboardCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
```

Or using localStorage:
```typescript
function cacheLocally(data, filters) {
  localStorage.setItem(
    `dashboard_${JSON.stringify(filters)}`,
    JSON.stringify({ data, timestamp: Date.now() })
  );
}

function getCachedLocally(filters) {
  const cached = localStorage.getItem(`dashboard_${JSON.stringify(filters)}`);
  if (!cached) return null;
  
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > 10 * 60 * 1000) return null; // 10 min expiry
  
  return data;
}
```

---

## Common Issues & Solutions

### Issue: Filters not updating charts
**Solution**: Ensure you're properly re-querying the API when filters change
```typescript
useEffect(() => {
  loadDashboard(filters);
}, [filters]);
```

### Issue: Month labels are weird (e.g., "undefined")
**Solution**: Check that month data is being returned correctly
```typescript
// Backend returns: "Jan '25"
// Frontend expects: month string
data.monthlyBreakdown[0].month // Should equal "Jan '25"
```

### Issue: Chart shows no data
**Solution**: Verify data transformation matches chart library expectations
```typescript
// Check the exact format your library needs
console.log('Raw data:', data);
console.log('Transformed data:', transformedData);
```

---

## Future Enhancements

- [ ] Configurable fiscal year per entity
- [ ] Custom date range filters
- [ ] Export to PDF/Excel
- [ ] Scheduled email reports
- [ ] Real-time data refreshing with WebSockets
- [ ] Drill-down into chart data
