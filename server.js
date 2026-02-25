const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();

const db = new sqlite3.Database('./expenses.db');
const ADMIN_PASSWORD = "passw0rd";

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true })); // To handle standard HTML form submits

// Initialize Database
db.run(`CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL,
    category TEXT,
    description TEXT,
    date TEXT
)`);

// ROUTE 1: The Main Page (Read)
app.get('/', (req, res) => {
    db.all("SELECT * FROM expenses ORDER BY date DESC", [], (err, rows) => {
        res.render('index', { expenses: rows });
    });
});

// ROUTE 2: Add Expense (Create)
app.post('/add', (req, res) => {
    const { amount, category, description, date } = req.body;
    db.run(`INSERT INTO expenses (amount, category, description, date) VALUES (?, ?, ?, ?)`,
        [amount, category, description, date],
        () => res.redirect('/')
    );
});

// ROUTE 3: Delete Expense (Delete)
app.post('/delete/:id', (req, res) => {
    db.run(`DELETE FROM expenses WHERE id = ?`, req.params.id, () => res.redirect('/'));
});

// ROUTE 4: Audit Export
app.post('/audit', (req, res) => {
    if (req.body.password !== ADMIN_PASSWORD) return res.status(403).send("Wrong Password");
    
    db.all("SELECT * FROM expenses ORDER BY date ASC", [], (err, rows) => {
        let csv = "ID,Date,Category,Description,Amount\n";
        rows.forEach(r => csv += `${r.id},${r.date},${r.category},"${r.description}",${r.amount}\n`);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit.csv');
        res.send(csv);
    });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
