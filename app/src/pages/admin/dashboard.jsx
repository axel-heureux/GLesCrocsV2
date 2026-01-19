import { useState } from 'react';
import './dashboard.css';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // État simulé pour le dashboard
  const [currentTicket, setCurrentTicket] = useState(42);
  const [readyTicket, setReadyTicket] = useState(null);
  const [queueList, setQueueList] = useState([43, 44, 45, 46]);
  
  const [menuItems, setMenuItems] = useState([
    { id: 1, name: 'Poulet rôti', stock: 12, available: true },
    { id: 2, name: 'Lasagnes Maison', stock: 5, available: true },
    { id: 3, name: 'Salade César', stock: 0, available: false },
    { id: 4, name: 'Pâtes carbonara', stock: 8, available: true },
  ]);

  // Actions
  const callNext = () => {
    if (queueList.length > 0) {
      const next = queueList[0];
      setCurrentTicket(next);
      setQueueList(queueList.slice(1));
      setReadyTicket(null); // Reset le statut "Prêt" au changement
    }
  };

  const markReady = () => {
    setReadyTicket(currentTicket);
  };

  const toggleAvailability = (id) => {
    setMenuItems(menuItems.map(item => 
      item.id === id ? { ...item, available: !item.available } : item
    ));
  };

  return (
    <div className="admin-container">
      {/* Header Admin */}
      <nav className="admin-nav">
        <div className="admin-brand">
          <span className="logo-circle">GLC</span>
          <span className="brand-text">ADMINISTRATION</span>
        </div>
        <button className="btn-outline" onClick={() => navigate('/')}>
          ← Retour Client
        </button>
      </nav>

      <main className="admin-grid">
        {/* Panneau de Contrôle File d'attente */}
        <section className="card control-panel">
          <h2 className="panel-title">Gestion de la File</h2>
          
          <div className="current-display">
            <span className="label">En préparation</span>
            <div className="big-number">{currentTicket}</div>
          </div>

          <div className="control-actions">
            <button 
              className={`btn-action btn-ready ${readyTicket === currentTicket ? 'active' : ''}`}
              onClick={markReady}
            >
              ✅ Notifier "Prêt"
            </button>
            
            <button className="btn-action btn-next" onClick={callNext}>
              📢 Appeler Suivant ({queueList[0] || '-'})
            </button>
          </div>

          <div className="queue-preview">
            <h3>Prochains tickets :</h3>
            <div className="queue-chips">
              {queueList.map(num => (
                <span key={num} className="chip">{num}</span>
              ))}
              {queueList.length === 0 && <span className="empty-msg">Aucune attente</span>}
            </div>
          </div>
        </section>

        {/* Panneau Gestion Menu (Stocks) */}
        <section className="card menu-panel">
          <h2 className="panel-title">Disponibilité Menu</h2>
          <div className="stock-list">
            {menuItems.map((item) => (
              <div key={item.id} className={`stock-item ${!item.available ? 'unavailable' : ''}`}>
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-stock">Stock restant: {item.stock}</span>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={item.available} 
                    onChange={() => toggleAvailability(item.id)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Panneau Statistiques Rapides */}
        <section className="card stats-panel">
          <div className="stat-box">
            <h3>Clients Servis</h3>
            <p>145</p>
          </div>
          <div className="stat-box">
            <h3>Temps Moyen</h3>
            <p>4 min</p>
          </div>
          <div className="stat-box">
            <h3>Chiffre du jour</h3>
            <p>1,250€</p>
          </div>
        </section>
      </main>
    </div>
  );
}