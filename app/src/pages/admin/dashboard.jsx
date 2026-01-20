import { useState, useEffect } from 'react';
import './dashboard.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // États Données
  const [currentTicket, setCurrentTicket] = useState('-'); 
  const [readyTicket, setReadyTicket] = useState(null);    
  const [queueList, setQueueList] = useState([]);          
  const [menuItems, setMenuItems] = useState([]);          

  // États Formulaire (Modal)
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', description: '', price: '', stock: 0 });

  useEffect(() => {
    fetchQueue();
    fetchMenu();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- API GET ---
  const fetchQueue = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/admin/queue');
      const orders = res.data;
      const preparing = orders.find(o => o.status === 'preparation');
      const waiting = orders.filter(o => o.status === 'en_attente').map(o => o.customer_number);
      setCurrentTicket(preparing ? preparing.customer_number : '-');
      setQueueList(waiting);
    } catch (err) { console.error(err); }
  };

  const fetchMenu = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/menu'); 
      setMenuItems(res.data);
    } catch (err) { console.error(err); }
  };

  // --- API QUEUE ---
  const callNext = async () => {
    await axios.post('http://localhost:3001/api/admin/next');
    setReadyTicket(null);
    fetchQueue();
  };

  const markReady = async () => {
    if (currentTicket === '-') return;
    await axios.post('http://localhost:3001/api/admin/ready', { ticketNumber: currentTicket });
    setReadyTicket(currentTicket);
    fetchQueue(); 
  };

  // --- API MENU (CRUD) ---

  // 1. Activer/Désactiver (Switch)
  const toggleAvailability = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await axios.put(`http://localhost:3001/api/admin/menu/${id}`, { is_active: newStatus });
      fetchMenu(); // Recharger pour être sûr
    } catch (err) { console.error(err); }
  };

  // 2. Supprimer
  const handleDelete = async (id) => {
    if(window.confirm("Voulez-vous vraiment supprimer ce plat ?")) {
      try {
        await axios.delete(`http://localhost:3001/api/admin/menu/${id}`);
        fetchMenu();
      } catch(err) { alert("Erreur suppression"); }
    }
  };

  // 3. Ouvrir Modal (Ajout ou Edition)
  const openModal = (item = null) => {
    if (item) {
      // Mode Edition
      setFormData({ 
        id: item.id, 
        name: item.name, 
        description: item.description, 
        price: item.price, 
        stock: item.stock 
      });
      setIsEditing(true);
    } else {
      // Mode Ajout
      setFormData({ id: null, name: '', description: '', price: '', stock: 10 });
      setIsEditing(false);
    }
    setShowModal(true);
  };

  // 4. Soumettre le formulaire
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`http://localhost:3001/api/admin/menu/edit/${formData.id}`, formData);
      } else {
        await axios.post('http://localhost:3001/api/admin/menu', formData);
      }
      setShowModal(false);
      fetchMenu();
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="admin-container">
      <nav className="admin-nav">
        <div className="admin-brand"><span className="logo-circle">GLC</span> ADMIN</div>
        <button className="btn-outline" onClick={() => navigate('/')}>← Retour Client</button>
      </nav>

      <main className="admin-grid">
        {/* Gestion File (inchangé) */}
        <section className="card control-panel">
          <h2 className="panel-title">Gestion de la File</h2>
          <div className="current-display">
            <span className="label">En préparation</span>
            <div className="big-number">{currentTicket}</div>
          </div>
          <div className="control-actions">
            <button className={`btn-action btn-ready ${readyTicket === currentTicket ? 'active' : ''}`} onClick={markReady} disabled={currentTicket === '-'}>✅ Prêt</button>
            <button className="btn-action btn-next" onClick={callNext}>📢 Suivant</button>
          </div>
          <div className="queue-preview">
            <h3>Attente :</h3>
            <div className="queue-chips">
              {queueList.map(num => <span key={num} className="chip">{num}</span>)}
            </div>
          </div>
        </section>

        {/* Gestion Menu (CRUD) */}
        <section className="card menu-panel">
          <div className="panel-header-row">
            <h2 className="panel-title">Carte & Menu</h2>
            <button className="btn-add" onClick={() => openModal(null)}>+ Nouveau Plat</button>
          </div>

          <div className="stock-list">
            {menuItems.map((item) => (
              <div key={item.id} className={`stock-item ${!item.is_active ? 'unavailable' : ''}`}>
                <div className="item-left">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <small>{item.price} € • Stock: {item.stock}</small>
                  </div>
                </div>
                
                <div className="item-actions">
                  <label className="switch" title="Activer/Désactiver">
                    <input 
                      type="checkbox" 
                      checked={item.is_active === 1 || item.is_active === true} 
                      onChange={() => toggleAvailability(item.id, item.is_active)}
                    />
                    <span className="slider round"></span>
                  </label>
                  
                  <button className="btn-icon edit" onClick={() => openModal(item)}>✏️</button>
                  <button className="btn-icon delete" onClick={() => handleDelete(item.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FENÊTRE MODALE (POPUP) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditing ? 'Modifier le plat' : 'Ajouter un plat'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nom du plat</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Prix (€)</label>
                  <input type="number" step="0.10" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-save">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}