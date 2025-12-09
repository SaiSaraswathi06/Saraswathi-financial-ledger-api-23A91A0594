const pool = require("../db");

// Helper: Get account balance
async function getBalance(accountId) {
  const result = await pool.query(
    `SELECT 
        COALESCE(SUM(
            CASE 
                WHEN entry_type = 'credit' THEN amount
                WHEN entry_type = 'debit' THEN -amount
            END
        ), 0) AS balance
     FROM ledger_entries
     WHERE account_id = $1`,
    [accountId]
  );

  return result.rows[0].balance;
}

// ---------------------------
// MAKE DEPOSIT
// ---------------------------
async function makeDeposit(accountId, amount) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create transaction
    const txResult = await client.query(
      `INSERT INTO transactions (transaction_type, dest_account_id, amount)
       VALUES ('deposit', $1, $2) RETURNING *`,
      [accountId, amount]
    );

    const txId = txResult.rows[0].id;

    // 2. Create ledger entries (double-entry)
    await client.query(
      `INSERT INTO ledger_entries (transaction_id, account_id, entry_type, amount)
       VALUES ($1, $2, 'credit', $3)`,
      [txId, accountId, amount]
    );

    // Optional system debit entry
    await client.query(
      `INSERT INTO ledger_entries (transaction_id, account_id, entry_type, amount)
       VALUES ($1, 0, 'debit', $2)`,
      [txId, amount]
    );

    await client.query("COMMIT");
    return { message: "Deposit successful", transactionId: txId };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ---------------------------
// MAKE WITHDRAWAL
// ---------------------------
async function makeWithdrawal(accountId, amount) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Check balance
    const balance = await getBalance(accountId);
    if (balance < amount) {
      throw new Error("Insufficient funds");
    }

    // 2. Create transaction
    const txResult = await client.query(
      `INSERT INTO transactions (transaction_type, source_account_id, amount)
       VALUES ('withdraw', $1, $2) RETURNING *`,
      [accountId, amount]
    );

    const txId = txResult.rows[0].id;

    // 3. Create ledger entries
    await client.query(
      `INSERT INTO ledger_entries (transaction_id, account_id, entry_type, amount)
       VALUES ($1, $2, 'debit', $3)`,
      [txId, accountId, amount]
    );

    // Optional system credit entry
    await client.query(
      `INSERT INTO ledger_entries (transaction_id, account_id, entry_type, amount)
       VALUES ($1, 0, 'credit', $2)`,
      [txId, amount]
    );

    await client.query("COMMIT");
    return { message: "Withdrawal successful", transactionId: txId };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ---------------------------
// MAKE TRANSFER
// ---------------------------
async function makeTransfer(fromAccountId, toAccountId, amount) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Check if fromAccount has enough balance
    const balance = await getBalance(fromAccountId);
    if (balance < amount) {
      throw new Error("Insufficient funds");
    }

    // 2. Create transaction
    const txResult = await client.query(
      `INSERT INTO transactions (transaction_type, source_account_id, dest_account_id, amount)
       VALUES ('transfer', $1, $2, $3) RETURNING *`,
      [fromAccountId, toAccountId, amount]
    );

    const txId = txResult.rows[0].id;

    // 3. Ledger: Debit fromAccount
    await client.query(
      `INSERT INTO ledger_entries (transaction_id, account_id, entry_type, amount)
       VALUES ($1, $2, 'debit', $3)`,
      [txId, fromAccountId, amount]
    );

    // 4. Ledger: Credit toAccount
    await client.query(
      `INSERT INTO ledger_entries (transaction_id, account_id, entry_type, amount)
       VALUES ($1, $2, 'credit', $3)`,
      [txId, toAccountId, amount]
    );

    await client.query("COMMIT");
    return { message: "Transfer successful", transactionId: txId };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  makeDeposit,
  makeWithdrawal,
  makeTransfer,
};
