const pool = require("../db");

// Create a new account
async function createAccount(data) {
  const { user_ref, account_type, currency } = data;

  const result = await pool.query(
    `INSERT INTO accounts (user_ref, account_type, currency)
     VALUES ($1, $2, $3) RETURNING *`,
    [user_ref, account_type, currency]
  );

  return result.rows[0];
}

// Get account details + balance
async function getAccountById(id) {
  // 1. Fetch the account
  const accountResult = await pool.query(
    `SELECT * FROM accounts WHERE id = $1`,
    [id]
  );

  if (accountResult.rows.length === 0) {
    throw new Error("Account not found");
  }

  const account = accountResult.rows[0];

  // 2. Calculate balance from ledger entries
  const balanceResult = await pool.query(
    `SELECT 
        COALESCE(SUM(
            CASE 
                WHEN entry_type = 'credit' THEN amount
                WHEN entry_type = 'debit' THEN -amount
            END
        ), 0) AS balance
     FROM ledger_entries
     WHERE account_id = $1`,
    [id]
  );

  account.balance = balanceResult.rows[0].balance;

  return account;
}

// Get ledger entries for an account
async function getAccountLedger(id) {
  const result = await pool.query(
    `SELECT * FROM ledger_entries
     WHERE account_id = $1
     ORDER BY created_at ASC`,
    [id]
  );

  return result.rows;
}

module.exports = {
  createAccount,
  getAccountById,
  getAccountLedger,
};
