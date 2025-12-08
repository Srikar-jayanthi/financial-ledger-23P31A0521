# Financial Ledger API 💰

A robust Banking REST API built with **Node.js** and **MySQL**. This project implements **Double-Entry Bookkeeping** principles to ensure absolute data integrity, immutable transaction history, and accurate balance calculations.

## 🚀 Features

* **Double-Entry Ledger:** Every transfer records a debit and a credit entry.
* **ACID Transactions:** Uses MySQL transactions to ensure operations are atomic (all or nothing).
* **Immutable Data:** Ledger entries cannot be updated or deleted, providing a secure audit trail.
* **Real-time Balance:** Balances are calculated on-the-fly by aggregating ledger history.
* **Data Integrity:** Prevents overdrafts and ensures valid transaction states.

## 🛠️ Tech Stack

* **Node.js & Express** - Backend Framework
* **MySQL (InnoDB)** - Relational Database
* **UUID** - Unique IDs for accounts and transactions
* **Body-Parser** - Request parsing

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone [https://github.com/Srikar-jayanthi/financial-ledger.git](https://github.com/Srikar-jayanthi/financial-ledger.git)
cd financial-ledger
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Configuration

1. Open **MySQL Workbench**.
2. Create a database named `ledger_db`.
3. Run the SQL script found in `schema.sql` to create the tables.

### 4. Configure Application

Open `server.js` and update the database connection password:

```javascript
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'YOUR_MYSQL_PASSWORD', // <--- Update this
    database: 'ledger_db',
    // ...
});
```

### 5. Run the Server

```bash
node server.js
```

The API will run on `http://localhost:3000`.

---

## 📡 API Endpoints

### 1️⃣ Create Account

**POST** `/accounts`

```json
{
  "name": "Srikar",
  "type": "Savings"
}
```

### 2️⃣ Get Balance

**GET** `/accounts/{accountId}`

### 3️⃣ Deposit Funds

**POST** `/deposits`

```json
{
  "accountId": "YOUR_ACCOUNT_ID",
  "amount": 5000
}
```

### 4️⃣ Transfer Money (Internal)

**POST** `/transfers`

```json
{
  "sourceAccountId": "SENDER_ID",
  "destAccountId": "RECEIVER_ID",
  "amount": 1000
}
```

### 5️⃣ View Statement (Ledger)

**GET** `/accounts/{accountId}/ledger`

---

## 🛡️ Database Schema

* **Accounts:** Stores user ID and metadata.
* **Transactions:** Records the intent and status of a move.
* **Ledger:** The immutable record of money movement (Debits/Credits).
