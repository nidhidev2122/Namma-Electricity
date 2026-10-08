import { useEffect, useState } from 'react';
import { getAdminOverview, getAdminUsers } from '../api.js';
import { Card } from './Common.jsx';

export default function Admin() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getAdminOverview(), getAdminUsers()])
      .then(([summary, accountRows]) => { setOverview(summary); setUsers(accountRows); })
      .catch(err => setError(err.message));
  }, []);

  if (error) return <Card title="Admin dashboard"><p className="form-error">{error}</p></Card>;
  if (!overview) return <Card title="Admin dashboard"><p className="muted">Loading admin data...</p></Card>;

  return <div className="stack">
    <div className="facts admin-facts">
      <Card><span className="eyebrow">Accounts</span><strong className="metric">{overview.users}</strong><span className="muted">Registered users</span></Card>
      <Card><span className="eyebrow">Reports</span><strong className="metric">{overview.reportsLast24Hours}</strong><span className="muted">Last 24 hours</span></Card>
      <Card><span className="eyebrow">Sessions</span><strong className="metric">{overview.activeSessions}</strong><span className="muted">Active sessions</span></Card>
    </div>
    <Card title="User accounts">
      <div className="admin-user-list">
        {users.map(account => <div className="admin-user" key={account.id}>
          <div><strong>{account.display_name || account.email}</strong><span>{account.display_name ? account.email : 'No display name'}</span></div>
          <span className={`badge ${account.role === 'admin' ? 'badge-high' : 'badge-low'}`}>{account.role}</span>
        </div>)}
      </div>
    </Card>
  </div>;
}
