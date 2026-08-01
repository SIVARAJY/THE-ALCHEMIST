import React, { useState, useEffect } from 'react';
import { Save, Clock, Users, Shield, Award, CheckCircle } from 'lucide-react';
import api from '../api';

const POLICY_ICONS = {
  cancellation_deadline_hours: Clock,
  max_bookings_per_user: Users,
  working_hours_start: Clock,
  working_hours_end: Clock,
  faculty_priority: Award,
};

const PolicySettings = () => {
  const [policies, setPolicies] = useState([]);
  const [editedValues, setEditedValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const res = await api.get('/policies');
      setPolicies(res.data || []);
      const vals = {};
      (res.data || []).forEach(p => { vals[p.key] = p.value; });
      setEditedValues(vals);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (key, value) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = policies.map(p => {
        if (editedValues[p.key] !== p.value) {
          return api.put(`/policies/${p.key}`, { value: editedValues[p.key] });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
      setSaved(true);
      fetchPolicies();
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (policy) => {
    const val = editedValues[policy.key] ?? policy.value;

    if (policy.key === 'faculty_priority') {
      return (
        <button
          type="button"
          onClick={() => handleChange(policy.key, val === 'true' ? 'false' : 'true')}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${val === 'true' ? 'bg-indigo-600' : 'bg-slate-300'}`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${val === 'true' ? 'translate-x-7' : 'translate-x-1'}`}
          />
        </button>
      );
    }

    if (policy.key.includes('working_hours')) {
      return (
        <input
          type="time"
          value={val}
          onChange={e => handleChange(policy.key, e.target.value)}
          className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none w-44 text-slate-800 font-medium"
        />
      );
    }

    return (
      <input
        type="number"
        min="1"
        value={val}
        onChange={e => handleChange(policy.key, e.target.value)}
        className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none w-32 text-slate-800 font-bold text-lg"
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-700">Reservation Policies</h3>
          <p className="text-sm text-slate-400 mt-1">Configure rules that govern how reservations are created, modified, and cancelled.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${saved ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'} disabled:opacity-50`}
        >
          {saved ? (
            <><CheckCircle className="w-5 h-5 mr-2" /> Saved!</>
          ) : (
            <><Save className="w-5 h-5 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {policies.map(policy => {
          const Icon = POLICY_ICONS[policy.key] || Shield;
          return (
            <div
              key={policy.key}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 text-sm">{policy.label}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{policy.description}</p>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  {renderInput(policy)}
                </div>
              </div>
            </div>
          );
        })}
        {policies.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
            No policies found. Please run the seed SQL in Supabase.
          </div>
        )}
      </div>
    </div>
  );
};

export default PolicySettings;
