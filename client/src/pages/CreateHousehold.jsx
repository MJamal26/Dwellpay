import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

export default function CreateHousehold() {
  const [form, setForm] = useState({ name: '', currency: 'INR' });
  const [loading, setLoading] = useState(false);
  const { setHousehold, user } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/households', form);
      setHousehold(data);
      addToast('Household created!', 'success');
      navigate('/onboarding/invite');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create household', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        {/* Step indicator */}
        <div className="step-indicator">
          <div className="step-dot active" />
          <div className="step-dot" />
          <div className="step-dot" />
        </div>

        <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>🏠</div>
        <h1 className="text-headline-lg" style={{ marginBottom: 'var(--space-2)' }}>
          Name your household
        </h1>
        <p className="text-muted mb-6">
          Give your shared space a name. This is what your housemates will see when they join.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="form-group">
            <label className="form-label">Household name</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Flat 302, The Crew, Casa Nova"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Default currency</label>
            <select
              className="form-input"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              <option value="INR">₹ Indian Rupee (INR)</option>
              <option value="USD">$ US Dollar (USD)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Creating...' : 'Create Household →'}
          </button>
        </form>

        <p className="text-center text-muted mt-4" style={{ fontSize: 'var(--text-label-sm)' }}>
          Step 1 of 3
        </p>
      </div>
    </div>
  );
}
