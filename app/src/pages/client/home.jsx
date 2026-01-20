import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client'; // On réimporte Socket.io
import './home.css';

// Connexion au serveur Socket
const socket = io('http://localhost:3001');

export default function Home() {
  const navigate = useNavigate();
  
  // États
  const [ticket, setTicket] = useState(null);       // Mon ticket à moi
  const [menuItems, setMenuItems] = useState([]);   // Le menu
  const [readyTicket, setReadyTicket] = useState(null); // Le numéro qui est PRÊT (affiché en vert)
  const [currentServing, setCurrentServing] = useState('-'); // Le numéro en préparation

// --- home.jsx ---

  useEffect(() => {
    // 1. Charger le Menu
    axios.get('http://localhost:3001/api/menu')
      .then(res => setMenuItems(res.data))
      .catch(err => console.error("Erreur menu", err));

    // 2. Charger l'état actuel de la file (CORRECTION ICI)
    // Cela permet de savoir si c'est "Prêt" même si on vient d'arriver ou de rafraichir
    axios.get('http://localhost:3001/api/queue/public-status')
      .then(res => {
        if (res.data.readyTicket) setReadyTicket(res.data.readyTicket);
        if (res.data.currentServing) setCurrentServing(res.data.currentServing);
      })
      .catch(err => console.error("Erreur status", err));

    // 3. Restaurer mon ticket depuis le localStorage
    const savedTicket = localStorage.getItem('myTicket');
    if (savedTicket) {
      setTicket(JSON.parse(savedTicket)); 
    }
  }, []);

  // 2. Écouter le serveur pour savoir qui est prêt (Temps réel)
  useEffect(() => {
    // Le serveur envoie 'queueUpdate' quand l'admin clique sur un bouton
    socket.on('queueUpdate', (data) => {
      // Si le serveur envoie des données complètes (cas idéal)
      if (data.readyTicket) setReadyTicket(data.readyTicket);
      if (data.currentServing) setCurrentServing(data.currentServing);
      
      // Note : Si vous n'avez pas encore implémenté l'envoi complet côté serveur, 
      // ce code ne plantera pas, mais ne mettra pas à jour tout seul.
    });

    return () => {
      socket.off('queueUpdate');
    };
  }, []);

const handleTicket = async () => {
    // CAS 1 : J'ai déjà un ticket -> JE VEUX ANNULER
    if (ticket) {
      try {
        // 1. On demande au serveur de supprimer le ticket (pour l'admin)
        // On utilise le numéro stocké dans l'état ticket
        await axios.delete(`http://localhost:3001/api/ticket/${ticket.number}`);
        console.log("Ticket supprimé du serveur");
      } catch (err) {
        console.error("Erreur suppression serveur (mais on continue localement)", err);
      }

      // 2. Nettoyage Local (OBLIGATOIRE)
      localStorage.removeItem('myTicket'); // On vide la mémoire du navigateur
      setTicket(null);                     // On vide l'affichage
      setReadyTicket(null);                // On enlève le message "C'est prêt" si besoin

    } 
    // CAS 2 : Je n'ai pas de ticket -> JE VEUX EN PRENDRE UN
    else {
      try {
        const res = await axios.post('http://localhost:3001/api/ticket');
        const newTicket = { number: res.data.number, status: 'waiting' };
        
        // 1. Mise à jour affichage
        setTicket(newTicket);
        
        // 2. Sauvegarde mémoire (Pour résister au F5)
        localStorage.setItem('myTicket', JSON.stringify(newTicket));
        
      } catch (err) {
        console.error(err);
        alert("Impossible de prendre un ticket (Vérifiez que le serveur tourne).");
      }
    }
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="top-navbar">
        <div className="logo-container">
           <div className="logo-placeholder">GLC</div>
           <span className="brand-name">GLESCROCS CANTINE</span>
        </div>
        <button className="btn-admin" onClick={() => navigate('/admin')}>🔐 Dashboard</button>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-overlay">
          <h1>GLESCROCS <br/><span>CANTINE</span></h1>
        </div>
      </header>

      <main className="main-grid">
        {/* Colonne Gauche : Menu */}
        <section className="card dark-card menu-section">
          <h2 className="section-title">Menu du jour</h2>
          <div className="menu-list">
            {menuItems.length === 0 ? (
              <p style={{textAlign: 'center', padding: '1rem'}}>Chargement du menu...</p>
            ) : (
              menuItems.map((item) => (
                <div key={item.id} className="menu-item">
                  <div className="menu-info">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p> 
                  </div>
                  <div className="menu-price-tag">{Number(item.price).toFixed(2)}€</div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Colonne Droite : Le Ticket */}
        <div className="sidebar-column">
          
          {/* C'est ICI que la correction est importante */}
          <section className="card dark-card status-section">
            <h2 className="section-title">État de la commande</h2>
            
            {/* CAS 1 : C'est prêt (Mon numéro == Le numéro prêt affiché par l'admin) */}
            {ticket && readyTicket === ticket.number ? (
              <div className="status-box ready">
                <h3>🍽 C'est prêt !</h3>
                <p>Veuillez récupérer la commande N° {ticket.number}</p>
              </div>
            ) : ticket ? (
              /* CAS 2 : J'ai un ticket, mais ce n'est pas encore prêt */
               <div className="status-box pending">
                <h3>En cuisine...</h3>
                <p>Votre N° {ticket.number} est en attente.</p>
                {/* On peut afficher qui est en train d'être servi */}
                <small>En cours de préparation : N° {currentServing}</small>
              </div>
            ) : (
              /* CAS 3 : Je n'ai pas de ticket */
              <div className="status-box idle">
                <h3>Aucune commande</h3>
                <p>Prenez un ticket pour commencer.</p>
              </div>
            )}
          </section>

          <section className="card dark-card ticket-section">
            <h2 className="section-title">Mon Ticket</h2>
            {ticket ? (
               <div className="ticket-action-box">
                  <div className="current-ticket">N° {ticket.number}</div>
                  <button className="white-btn" onClick={handleTicket}>Annuler</button>
               </div>
            ) : (
              <div className="ticket-action-box">
                <button className="white-btn" onClick={handleTicket}>Prendre un ticket</button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}