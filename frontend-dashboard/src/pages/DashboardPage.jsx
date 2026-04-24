import { useState, useEffect } from 'react';
import api from '../lib/api';
import { logout } from '../lib/auth';
import { getPersona } from '../lib/utils';
import FirstScanView from '../components/scans/FirstScanView';
import SecondScanView from '../components/scans/SecondScanView';
import ReturningMemberView from '../components/scans/ReturningMemberView';
import UploadScanButton from '../components/scans/UploadScanButton';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [{ data: meData }] = await Promise.all([api.get('/auth/me')]);
      setUser(meData.user);
      const { data: scansData } = await api.get(`/members/${meData.user.id}/scans`);
      // API returns scans desc; reverse for chronological in charts
      setScans(scansData.scans);
    } catch {
      setError('Failed to load your data.');
    } finally {
      setLoading(false);
    }
  }

  function handleScanUploaded(newScan) {
    setScans(prev => [newScan, ...prev]);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">Loading your dashboard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  const persona = getPersona(scans.length);
  // Most recent scan first from API; chronological for charts
  const chronological = [...scans].reverse();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Kalos</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Page title + upload */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {scans.length === 0
                ? `Welcome, ${user?.name?.split(' ')[0]}`
                : `Hi, ${user?.name?.split(' ')[0]}`}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {scans.length === 0
                ? 'Upload your first DEXA scan to get started.'
                : scans.length === 1
                ? '1 scan on record'
                : `${scans.length} scans on record`}
            </p>
          </div>
          <UploadScanButton onUploaded={handleScanUploaded} />
        </div>

        {/* Persona-adaptive content */}
        {scans.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-gray-800 font-semibold mb-1">No scans yet</h3>
            <p className="text-gray-400 text-sm">Upload your first DEXA scan PDF using the button above.</p>
          </div>
        )}

        {persona === 'first' && <FirstScanView scan={scans[0]} />}
        {persona === 'second' && <SecondScanView scans={chronological} />}
        {persona === 'returning' && <ReturningMemberView scans={chronological} />}
      </main>
    </div>
  );
}
