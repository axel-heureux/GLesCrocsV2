// server.js
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';

const app = express();
app.use(cors()); // Autorise React à parler au serveur
app.use(express.json());

// 1. Connexion à la Base de Données (Mettez vos infos MAMP/XAMPP)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // Par défaut sous XAMPP/WAMP
  password: '',      // Souvent vide par défaut
  database: 'glescrocs' // Le nom dans votre fichier SQL
});

db.connect((err) => {
  if (err) console.error('Erreur connexion DB:', err);
  else console.log('✅ Connecté à la base de données MySQL');
});

// --- ROUTES API ---

// 2. Récupérer le Menu (depuis la table 'products')
app.get('/api/menu', (req, res) => {
  // On récupère les produits actifs
  const sql = "SELECT * FROM products WHERE is_active = 1";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// 3. Prendre un ticket (Insérer dans la table 'orders')
app.post('/api/ticket', (req, res) => {
  // Génère un numéro client (simplifié pour l'exemple)
  const customerNumber = Math.floor(Math.random() * 1000); 
  
  const sql = "INSERT INTO orders (customer_number, total_amount, status) VALUES (?, 0, 'en_attente')";
  
  db.query(sql, [customerNumber], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ 
      ticketId: result.insertId, 
      number: customerNumber,
      status: 'waiting'
    });
  });
});

// 4. Vérifier l'état de la file (depuis 'orders')
app.get('/api/status', (req, res) => {
  // Compte combien de personnes attendent
  const sql = "SELECT COUNT(*) as waitingCount FROM orders WHERE status = 'en_attente'";
  db.query(sql, (err, data) => {
    if (err) return res.status(500).json(err);
    res.json({ waiting: data[0].waitingCount });
  });
});

app.listen(3001, () => {
  console.log("🚀 Serveur lancé sur le port 3001");
});