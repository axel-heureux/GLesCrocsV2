import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';
// Assurez-vous d'avoir le logo, sinon commentez l'import
// import logo from '../../assets/main_logo.png'; 

export default function Home() {
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  
  // Données correspondant exactement à la maquette
  const [menuItems] = useState([
    { id: 1, name: 'Poulet rôti', desc: 'Avec légumes de saison', price: 8.50 },
    { id: 2, name: 'Lasagnes Maison', desc: 'Sauce bolognaise', price: 10.50 },
    { id: 3, name: 'Salade César', desc: 'Poulet grillé, croûtons', price: 7.50 },
    { id: 4, name: 'Pâtes carbonara', desc: 'Crème fraîche', price: 12.50 },
  ]);

  const handleTicket = () => {
    if (ticket) {
      setTicket(null); // Annuler
    } else {
      setTicket({ number: 45, status: 'waiting' }); // Simuler un ticket
    }
  };

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <nav className="top-navbar">
        <div className="logo-container">
           {/* Placeholder pour le logo Glescrocs */}
           <div className="logo-placeholder">GLC</div>
           <span className="brand-name">GLESCROCS CANTINE</span>
        </div>
        <button className="btn-admin" onClick={() => navigate('/admin')}>🔐 Dashboard Admin</button>
        <div className="mobile-menu-icon">☰</div>
      </nav>

      {/* Hero Section avec Image */}
      <header className="hero-section">
        <div className="hero-overlay">
          <h1>GLESCROCS <br/><span>CANTINE</span></h1>
        </div>
      </header>

      <main className="main-grid">
        {/* Colonne Gauche : Menu du jour */}
        <section className="card dark-card menu-section">
          <h2 className="section-title">Menu du jour</h2>
          <div className="menu-list">
            {menuItems.map((item) => (
              <div key={item.id} className="menu-item">
                <div className="menu-info">
                  <h3>{item.name}</h3>
                  <p>{item.desc}</p>
                </div>
                <div className="menu-price-tag">
                  {item.price.toFixed(2)}€
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Colonne Droite : États et Actions */}
        <div className="sidebar-column">
          
          {/* Carte État de la commande */}
          <section className="card dark-card status-section">
            <h2 className="section-title">En préparation</h2>
            
            {ticket ? (
              <div className="status-box ready">
                <h3>Votre commande est prête</h3>
              </div>
            ) : (
               <div className="status-box pending">
                <h3>Commande en attente</h3>
              </div>
            )}
          </section>

          {/* Carte Ticket */}
          <section className="card dark-card ticket-section">
            <h2 className="section-title">Prendre un ticket</h2>
            {ticket ? (
               <div className="ticket-action-box">
                  <div className="current-ticket">N° {ticket.number}</div>
                  <button className="white-btn" onClick={handleTicket}>
                    Annuler mon ticket
                  </button>
               </div>
            ) : (
              <div className="ticket-action-box">
                <p>La faim n'attend pas</p>
                <button className="white-btn" onClick={handleTicket}>
                  Prendre un ticket
                </button>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}