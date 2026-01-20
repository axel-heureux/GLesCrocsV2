import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURATION SOCKET.IO ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"], // Vos ports frontend
    methods: ["GET", "POST"]
  }
});

// --- CONNEXION BASE DE DONNÉES ---
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // Par défaut sous XAMPP/WAMP
  password: '',      // Souvent vide par défaut
  database: 'glescrocs'
});

db.connect((err) => {
  if (err) console.error('❌ Erreur connexion DB:', err.message);
  else console.log('✅ Connecté à la base de données MySQL');
});

// --- ROUTES API (C'est ici que ça bloquait) ---

// 1. Récupérer le Menu (GET)
app.get('/api/menu', (req, res) => {
  const sql = "SELECT * FROM products WHERE is_active = 1";
  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur SQL" });
    }
    console.log("Menu envoyé :", result.length, "articles");
    res.json(result);
  });
});

// 2. Prendre un ticket (POST)
app.post('/api/ticket', (req, res) => {
  const customerNumber = Math.floor(Math.random() * 1000) + 1; 
  // Assurez-vous d'avoir une table 'orders' aussi, sinon créez-la
  const sql = "INSERT INTO orders (customer_number, status) VALUES (?, 'en_attente')";
  
  db.query(sql, [customerNumber], (err, result) => {
    if (err) return res.status(500).json(err);
    
    // Notifier tout le monde via Socket
    io.emit('queueUpdate', { newTicket: customerNumber });
    
    res.json({ ticketId: result.insertId, number: customerNumber });
  });
});

// --- DÉMARRAGE DU SERVEUR ---
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Serveur backend lancé sur http://localhost:${PORT}`);
});

// 3. Prendre un ticket (POST)
app.post('/api/ticket', (req, res) => {
  // Génère un numéro aléatoire entre 1 et 1000
  const customerNumber = Math.floor(Math.random() * 1000) + 1; 
  
  const sql = "INSERT INTO orders (customer_number, status) VALUES (?, 'en_attente')";
  
  db.query(sql, [customerNumber], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur lors de la création du ticket" });
    }
    
    // IMPORTANT : On prévient tout le monde (Socket.io) qu'une nouvelle commande est arrivée
    io.emit('queueUpdate', { type: 'NEW_TICKET' });
    
    // On renvoie le numéro au client React
    res.json({ ticketId: result.insertId, number: customerNumber });
  });
});

// --- ROUTES ADMIN ---

// 1. Récupérer la file d'attente complète (pour l'affichage admin)
app.get('/api/admin/queue', (req, res) => {
  // On récupère les commandes en attente et en préparation
  const sql = "SELECT * FROM orders WHERE status IN ('en_attente', 'preparation') ORDER BY id ASC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// 2. Appeler le client suivant (Passe de 'en_attente' à 'preparation')
app.post('/api/admin/next', (req, res) => {
  // On cherche le plus vieux ticket en attente
  const sqlSelect = "SELECT id, customer_number FROM orders WHERE status = 'en_attente' ORDER BY id ASC LIMIT 1";
  
  db.query(sqlSelect, (err, results) => {
    if (results.length === 0) return res.json({ message: "Aucun client en attente" });

    const ticket = results[0];
    // On met à jour son statut
    const sqlUpdate = "UPDATE orders SET status = 'preparation' WHERE id = ?";
    
    db.query(sqlUpdate, [ticket.id], (err) => {
      if (err) return res.status(500).json(err);
      
      // OPTIONNEL : Si vous utilisez Socket.io, ajoutez ici : io.emit('queueUpdate');
      res.json({ success: true, ticket: ticket });
    });
  });
});

// 3. Marquer un ticket comme prêt (Passe de 'preparation' à 'prêt')
app.post('/api/admin/ready', (req, res) => {
  const { ticketNumber } = req.body;
  const sql = "UPDATE orders SET status = 'prêt' WHERE customer_number = ?";
  
  db.query(sql, [ticketNumber], (err, result) => {
    if (err) return res.status(500).json(err);
    
    // LA LIGNE IMPORTANTE : On dit à tout le monde "Le ticket X est prêt"
    io.emit('queueUpdate', { readyTicket: ticketNumber });
    
    res.json({ success: true });
  });
});

// 4. Modifier la disponibilité d'un plat (Menu)
app.put('/api/admin/menu/:id', (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body; // On attend true ou false (1 ou 0)

  const sql = "UPDATE products SET is_active = ? WHERE id = ?";
  db.query(sql, [is_active, id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

// --- SUITE DES ROUTES ADMIN (CRUD MENU) ---

// 5. AJOUTER un plat (CREATE)
app.post('/api/admin/menu', (req, res) => {
  const { name, description, price, stock } = req.body;
  const sql = "INSERT INTO products (name, description, price, stock, is_active) VALUES (?, ?, ?, ?, 1)";
  
  db.query(sql, [name, description, price, stock || 0], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true, id: result.insertId });
  });
});

// 6. MODIFIER un plat (UPDATE - Détails)
app.put('/api/admin/menu/edit/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock } = req.body;
  
  const sql = "UPDATE products SET name=?, description=?, price=?, stock=? WHERE id=?";
  
  db.query(sql, [name, description, price, stock, id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

// 7. SUPPRIMER un plat (DELETE)
app.delete('/api/admin/menu/:id', (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM products WHERE id = ?";
  
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

// --- server.js (Ajouter avant la fin) ---

// Route pour récupérer l'état PUBLIC de la file (Utilisé par Home au chargement)
app.get('/api/queue/public-status', (req, res) => {
  const sql = "SELECT customer_number, status FROM orders WHERE status IN ('preparation', 'pret', 'prêt')";
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    
    let currentServing = '-';
    let readyTicket = null;
    
    results.forEach(row => {
      if (row.status === 'preparation') currentServing = row.customer_number;
      // On gère les deux orthographes au cas où
      if (row.status === 'pret' || row.status === 'prêt') readyTicket = row.customer_number;
    });
    
    res.json({ currentServing, readyTicket });
  });
});

// --- server.js ---

// Route pour ANNULER un ticket (DELETE)
app.delete('/api/ticket/:number', (req, res) => {
  const { number } = req.params;
  const sql = "DELETE FROM orders WHERE customer_number = ?";
  
  db.query(sql, [number], (err, result) => {
    if (err) return res.status(500).json(err);
    
    // On prévient l'admin que la file a changé
    io.emit('queueUpdate', { type: 'CANCEL_TICKET' });
    
    res.json({ success: true });
  });
});