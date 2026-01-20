import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './home.css';

const socket = io('http://localhost:3001');

export default function Home() {
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState(null);
  const [menuItems, setMenuItems] = useState([]);   
  const [readyTicket, setReadyTicket] = useState(null); 
  const [currentServing, setCurrentServing] = useState('-'); 

  useEffect(() => {
    // Charger le menu
    axios.get('http://localhost:3001/api/menu')
      .then(res => setMenuItems(res.data))
      .catch(err => console.error("Erreur menu", err));

    // Charger l'état actuel de la file
    axios.get('http://localhost:3001/api/queue/public-status')
      .then(res => {
        if (res.data.readyTicket) setReadyTicket(res.data.readyTicket);
        if (res.data.currentServing) setCurrentServing(res.data.currentServing);
      })
      .catch(err => console.error("Erreur status", err));

    // Récupérer le ticket depuis localStorage
    const savedTicket = localStorage.getItem('myTicket');
    if (savedTicket) {
      setTicket(JSON.parse(savedTicket)); 
    }
  }, []);

  useEffect(() => {
    socket.on('queueUpdate', (data) => {
      if (data.readyTicket !== undefined) setReadyTicket(data.readyTicket);
      if (data.currentServing !== undefined) setCurrentServing(data.currentServing);
    });
    return () => socket.off('queueUpdate');
  }, []);

  // Fonction pour commander un plat
  const handleOrder = async (item) => {
    if (ticket) return alert("Vous avez déjà une commande en cours !");

    try {
      const res = await axios.post('http://localhost:3001/api/ticket', { 
        productId: item.id 
      });

      const newTicket = { 
        number: res.data.number, 
        status: 'waiting',
        productName: item.name
      };
      
      setTicket(newTicket);
      localStorage.setItem('myTicket', JSON.stringify(newTicket));
      
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la commande.");
    }
  };

  // Fonction pour annuler
  const handleCancel = async () => {
    if (!ticket) return;

    try {
      await axios.delete(`http://localhost:3001/api/ticket/${ticket.number}`);
    } catch (err) { console.error(err); }

    localStorage.removeItem('myTicket');
    setTicket(null);
    setReadyTicket(null);
  };

  return (
    <div className="app-container">
      <nav className="top-navbar">
        <div className="logo-container">
           <div className="logo-placeholder">GLC</div>
           <span className="brand-name">GLESCROCS CANTINE</span>
        </div>
        <button className="btn-admin" onClick={() => navigate('/admin')}>🔐 Dashboard</button>
      </nav>

      <header className="hero-section">
        <div className="hero-overlay">
          <h1>GLESCROCS <br/><span>CANTINE</span></h1>
        </div>
      </header>

      <main className="main-grid">
        <section className="card dark-card menu-section">
          <h2 className="section-title">Menu du jour</h2>
          <div className="menu-list">
            {menuItems.map((item) => (
              <div key={item.id} className="menu-item">
                <div className="menu-info">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p> 
                </div>
                <div className="menu-actions">
                    <span className="menu-price-tag">{Number(item.price).toFixed(2)}€</span>
                    
                    {!ticket && (
                        <button className="btn-order" onClick={() => handleOrder(item)}>
                            Commander
                        </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="sidebar-column">
          <section className="card dark-card status-section">
            <h2 className="section-title">État de la commande</h2>
            
            {ticket && readyTicket === ticket.number ? (
              <div className="status-box ready">
                <h3>🍽 C'est prêt !</h3>
                <p className="blink">Commande N° {ticket.number}</p>
                {ticket.productName && <small>Plat : {ticket.productName}</small>}
              </div>
            ) : ticket ? (
               <div className="status-box pending">
                <h3>En cuisine...</h3>
                <p>N° {ticket.number}</p>
                {ticket.productName && <small>({ticket.productName})</small>}
                
                <div className="waiting-info">
                  <span>En préparation :</span>
                  <span className="big-counter">{currentServing}</span>
                </div>
              </div>
            ) : (
              <div className="status-box idle">
                <h3>Bonjour !</h3>
                <p>Cliquez sur "Commander" à côté d'un plat pour commencer.</p>
              </div>
            )}
          </section>

          <section className="card dark-card ticket-section">
            <h2 className="section-title">Mon Ticket</h2>
            {ticket ? (
               <div className="ticket-action-box">
                  <div className="current-ticket">N° {ticket.number}</div>
                  <button className="white-btn" onClick={handleCancel}>Annuler ma commande</button>
               </div>
            ) : (
              <div className="ticket-action-box inactive">
                <p>Aucun ticket actif</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}