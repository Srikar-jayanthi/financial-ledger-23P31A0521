const express = require('express');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const PORT = 3000;

// Database Connection
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',             // Default MySQL username
    password: 'SrikaR123@',
    database: 'ledger_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- HELPER FUNCTIONS ---

async function getBalance(connection, accountId) {
    const [rows] = await connection.execute(
        'SELECT SUM(amount) as balance FROM ledger WHERE account_id = ?',
        [accountId]
    );
    return Number(rows[0].balance) || 0;
}

// --- API ENDPOINTS ---

// 1. Create Account
app.post('/accounts', async (req, res) => {
    const { name, type } = req.body;
    const id = uuidv4();
    try {
        await pool.execute(
            'INSERT INTO accounts (id, name, type) VALUES (?, ?, ?)',
            [id, name, type]
        );
        res.status(201).json({ id, name, balance: 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get Account Details
app.get('/accounts/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const balance = await getBalance(pool, id);
        const [rows] = await pool.execute('SELECT * FROM accounts WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Account not found" });
        
        res.json({ ...rows[0], balance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Get Ledger History
app.get('/accounts/:id/ledger', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM ledger WHERE account_id = ? ORDER BY created_at DESC',
            [id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. DEPOSITS
app.post('/deposits', async (req, res) => {
    const { accountId, amount } = req.body;
    const depositAmount = Number(amount);

    if (depositAmount <= 0) return res.status(400).json({ error: "Amount must be positive" });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const transactionId = uuidv4();

        // Transaction Record
        await connection.execute(
            `INSERT INTO transactions (id, type, amount, status) VALUES (?, 'deposit', ?, 'completed')`,
            [transactionId, depositAmount]
        );
        // Credit Ledger
        await connection.execute(
            `INSERT INTO ledger (id, account_id, transaction_id, amount, type) VALUES (?, ?, ?, ?, 'credit')`,
            [uuidv4(), accountId, transactionId, depositAmount]
        );

        await connection.commit();
        res.status(201).json({ status: 'success', transactionId, newBalance: await getBalance(pool, accountId) });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// 5. WITHDRAWALS
app.post('/withdrawals', async (req, res) => {
    const { accountId, amount } = req.body;
    const withdrawAmount = Number(amount);

    if (withdrawAmount <= 0) return res.status(400).json({ error: "Amount must be positive" });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const currentBalance = await getBalance(connection, accountId);
        if (currentBalance < withdrawAmount) {
            throw new Error('Insufficient funds');
        }

        const transactionId = uuidv4();
        // Transaction Record
        await connection.execute(
            `INSERT INTO transactions (id, type, amount, status) VALUES (?, 'withdrawal', ?, 'completed')`,
            [transactionId, withdrawAmount]
        );
        // Debit Ledger
        await connection.execute(
            `INSERT INTO ledger (id, account_id, transaction_id, amount, type) VALUES (?, ?, ?, ?, 'debit')`,
            [uuidv4(), accountId, transactionId, -withdrawAmount]
        );

        await connection.commit();
        res.status(201).json({ status: 'success', transactionId });
    } catch (err) {
        await connection.rollback();
        res.status(422).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// 6. TRANSFERS
app.post('/transfers', async (req, res) => {
    const { sourceAccountId, destAccountId, amount } = req.body;
    const transferAmount = Number(amount);

    if (transferAmount <= 0) return res.status(400).json({ error: "Amount must be positive" });
    if (sourceAccountId === destAccountId) return res.status(400).json({ error: "Cannot transfer to self" });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const currentBalance = await getBalance(connection, sourceAccountId);
        if (currentBalance < transferAmount) {
            throw new Error('Insufficient funds');
        }

        const transactionId = uuidv4();
        // Transaction Metadata
        await connection.execute(
            `INSERT INTO transactions (id, type, amount, status) VALUES (?, 'transfer', ?, 'completed')`,
            [transactionId, transferAmount]
        );
        // Debit Source
        await connection.execute(
            `INSERT INTO ledger (id, account_id, transaction_id, amount, type) VALUES (?, ?, ?, ?, 'debit')`,
            [uuidv4(), sourceAccountId, transactionId, -transferAmount]
        );
        // Credit Destination
        await connection.execute(
            `INSERT INTO ledger (id, account_id, transaction_id, amount, type) VALUES (?, ?, ?, ?, 'credit')`,
            [uuidv4(), destAccountId, transactionId, transferAmount]
        );

        await connection.commit();
        res.status(201).json({ status: 'success', transactionId });
    } catch (err) {
        await connection.rollback();
        res.status(422).json({ error: err.message });
    } finally {
        connection.release();
    }
});
// Add this simple route for the root path
app.get('/', (req, res) => {
    res.send('<h1>Financial Ledger API is running! 🚀</h1>');
});

app.listen(PORT, () => {
    console.log(`Financial Ledger API running on port ${PORT}`);
});