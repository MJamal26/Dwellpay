import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function JoinHousehold() {
  const { code } = useParams();
  const { setHousehold, token } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState('joining'); // joining | success | error

  useEffect(() => {
    if (!token) {
      navigate(`/login?redirect=/join/${code}`);
      return;
    }
    api.post(`/households/join/${code}`)
      .then(({ data }) => {
        setHousehold(data);
        addToast(`Joined ${data.name}! 🎉`, 'success');
        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 1500);
      })
      .catch((err) => {
        addToast(err.response?.data?.message || 'Invalid invite code', 'error');
        setStatus('error');
      });
  }, []);

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card" style={{ textAlign: 'center' }}>
        {status === 'joining' && (
          <>
            <LoadingSpinner />
            <p className="text-muted mt-4">Joining household...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 64 }}>🎉</div>
            <h2 className="text-headline-lg mt-4">Joined!</h2>
            <p className="text-muted">Redirecting to dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 64 }}>😕</div>
            <h2 className="text-headline-lg mt-4">Invalid Code</h2>
            <p className="text-muted mb-6">This invite code is invalid or expired.</p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
