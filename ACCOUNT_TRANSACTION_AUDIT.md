# Account Transaction Record Audit

## Overview
AccountTransaction records are used to create an audit trail of all account balance changes. They should be created whenever an account balance is updated during any posting operation.

---

## Current Status by Component

### ✅ CREATES AccountTransaction Records

#### 1. Invoice Posting
- **File**: `src/bullmq/bullmq.processor.ts` - `handleInvoiceJournalPosting()`
- **Line**: 531
- **Status**: ✅ Creates AccountTransaction for each journal line
- **Transaction Type**: `INVOICE_POSTING`
- **Details**: Includes debit/credit amounts, running balance, related invoice ID

#### 2. Payment Received Posting
- **File**: `src/bullmq/bullmq.processor.ts` - `handlePaymentReceivedPosting()`
- **Line**: 722
- **Status**: ✅ Creates AccountTransaction for each journal line
- **Transaction Type**: `PAYMENT_RECEIVED_POSTING`
- **Details**: Includes bank account ID, payment number, running balance

#### 3. Receipt Posting
- **File**: `src/bullmq/bullmq.processor.ts` - `handleReceiptJournalPosting()`
- **Line**: 994
- **Status**: ✅ Creates AccountTransaction for each journal line
- **Transaction Type**: `RECEIPT_POSTING`
- **Details**: Includes receipt number, running balance

#### 4. Bill Posting
- **File**: `src/bullmq/bullmq.processor.ts` - `handleBillJournalPosting()`
- **Line**: 1226
- **Status**: ✅ Creates AccountTransaction for each journal line
- **Transaction Type**: `BILL_POSTING`
- **Details**: Includes bill number, running balance

#### 5. Expense Posting
- **File**: `src/bullmq/bullmq.processor.ts` - `handleExpenseJournalPosting()`
- **Line**: 1428
- **Status**: ✅ Creates AccountTransaction for each journal line
- **Transaction Type**: `EXPENSE_POSTING`
- **Details**: Includes expense reference, running balance

#### 6. Payment Made Posting
- **File**: `src/bullmq/bullmq.processor.ts` - `handlePaymentMadeJournalPosting()`
- **Line**: 1613
- **Status**: ✅ Creates AccountTransaction for each journal line
- **Transaction Type**: `PAYMENT_MADE_POSTING`
- **Details**: Includes payment reference, running balance

#### 7. Bank Account Transactions
- **File**: `src/banking/banking.service.ts` - `createAccountTransaction()`
- **Line**: 339
- **Status**: ✅ Creates AccountTransaction for bank debit/credit transactions
- **Transaction Type**: `BANK`
- **Details**: Handles debit/credit, payee info, running balance

#### 8. Opening Balance Posting
- **File**: `src/accounts/opening-balance/opening-balance.service.ts` - `postOpeningBalanceToJournalInternal()`
- **Line**: 295-325
- **Status**: ✅ Creates AccountTransaction for each opening balance line
- **Transaction Type**: `OPENING_BALANCE`
- **Details**: Includes debit/credit amounts, running balance, related opening balance ID

#### 9. Manual Journal Posting
- **File**: `src/bullmq/bullmq.processor.ts` - `handleManualJournalPosting()`
- **Line**: 1855-1875
- **Status**: ✅ Creates AccountTransaction for each journal line
- **Transaction Type**: `JOURNAL_ENTRY`
- **Details**: Includes debit/credit amounts, running balance, related journal ID

---

## ❌ MISSING AccountTransaction Records

### 1. Account Service - Direct Balance Updates
- **File**: `src/accounts/account/account.service.ts` - `setOpeningBalances()`
- **Line**: 268
- **Status**: ❌ **MISSING** AccountTransaction creation
- **Action Needed**: Create AccountTransaction for each balance set
- **Note**: This is a special endpoint for bulk setting opening balances

---

## Summary Statistics

| Status | Count | Operations |
|--------|-------|-----------|
| ✅ With Transactions | 9 | Invoice, Payment Received, Receipt, Bill, Expense, Payment Made, Bank, Opening Balance, Manual Journal |
| ❌ Missing Transactions | 1 | Direct Account Balance (setOpeningBalances) |
| **TOTAL** | **10** | |

---

## Priority Fixes

### COMPLETED ✅
1. **Opening Balance Posting** - Now creates AccountTransaction for audit trail
2. **Manual Journal Posting** - Now creates AccountTransaction for audit trail

### LOW PRIORITY  
3. **Direct Balance Updates** - Rarely used endpoint, audit still recommended

---

## Recommended Pattern

All AccountTransaction creates should follow this structure:

```typescript
await tx.accountTransaction.create({
  data: {
    date: new Date(),
    description: `[Document Type] [Reference] posted to journal`,
    reference: journalReference,
    type: '[TRANSACTION_TYPE]', // e.g., 'OPENING_BALANCE'
    status: 'Success',
    accountId: line.accountId,
    debitAmount: line.debit || 0,
    creditAmount: line.credit || 0,
    runningBalance: updatedBalance, // Balance AFTER update
    entityId: entityId,
    relatedEntityId: sourceDocumentId, // Invoice ID, etc.
    relatedEntityType: 'SourceDocumentType', // 'OpeningBalance', etc.
    metadata: {
      // Add relevant metadata
      journalReference: journalRef,
    },
  },
});
```

---

## Next Steps

1. ✅ Add AccountTransaction creation to Opening Balance posting
2. ✅ Add AccountTransaction creation to Manual Journal posting  
3. (Optional) Add to Direct Account Balance updates (setOpeningBalances)
4. Test audit trails in UI
5. Create reports showing transaction history per account
