import React, { useEffect, useState } from 'react';
import { Search, Mail, User, Clock, Trash2, CheckCircle2, MessageSquare, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import toast from 'react-hot-toast';

const TrialRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/trial-requests');
      setRequests(response.data.data);
    } catch (err) {
      toast.error('Failed to load trial requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleMarkReviewed = async (id) => {
    try {
      await api.patch(`/trial-requests/${id}`, { status: 'Reviewed' });
      toast.success('Inquiry marked as reviewed.');
      fetchRequests();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trial request inquiry?')) return;
    try {
      await api.delete(`/trial-requests/${id}`);
      toast.success('Inquiry deleted.');
      fetchRequests();
    } catch (err) {
      toast.error('Failed to delete inquiry.');
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesSearch = 
      req.fullName.toLowerCase().includes(search.toLowerCase()) ||
      req.email.toLowerCase().includes(search.toLowerCase()) ||
      req.subject.toLowerCase().includes(search.toLowerCase()) ||
      req.message.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            Start Free Trial Inquiries
          </h1>
          <p className="text-xs text-slate-450 dark:text-darkMuted">
            Review and manage institutional sandbox and free trial messages from landing page visitors.
          </p>
        </div>
      </div>

      {/* Filters Search inputs */}
      <Card className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Search inquiries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-55/30 dark:bg-[#0d112b]/60 border border-slate-200 dark:border-slate-800/80 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-brand-neonCyan transition-all"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-450 dark:text-darkMuted whitespace-nowrap">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-205 dark:bg-darkSurface dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-neonCyan"
          >
            <option value="All">All Inquiries</option>
            <option value="Pending">Pending</option>
            <option value="Reviewed">Reviewed</option>
          </select>
        </div>
      </Card>

      {/* Requests table list */}
      {loading ? (
        <Card className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="h-8 w-8 rounded-full border-2 border-brand-neonCyan border-t-transparent animate-spin" />
          <span className="text-xs text-slate-450 dark:text-darkMuted">Fetching incoming sandbox trial requests...</span>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center py-16 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center text-slate-400">
            <MessageSquare size={22} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Inquiries Found</h3>
          <p className="text-xs text-slate-400 dark:text-darkMuted max-w-sm">
            {search || statusFilter !== 'All' 
              ? "No trial request matches your current search criteria." 
              : "No visitors have submitted free trial requests from the landing page yet."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((req) => (
            <Card 
              key={req._id} 
              className={`border-l-4 transition-all hover:translate-x-0.5 ${
                req.status === 'Reviewed' 
                  ? 'border-l-brand-emerald/70 dark:border-l-brand-emerald' 
                  : 'border-l-amber-500/70 dark:border-l-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
              }`}
            >
              <div className="flex flex-col space-y-3">
                {/* Header detail */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/50 pb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-brand-blue/10 dark:bg-brand-blue/20 flex items-center justify-center text-brand-blue dark:text-brand-blueLight font-semibold text-xs uppercase">
                      {req.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        {req.fullName}
                        <span className="text-[10px] text-slate-400 font-normal font-mono">&lt;{req.email}&gt;</span>
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 dark:text-darkMuted">
                        <Clock size={11} />
                        <span>{new Date(req.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={req.status === 'Reviewed' ? 'emerald' : 'warning'}>
                      {req.status}
                    </Badge>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-darkMuted uppercase">
                      {req.subject}
                    </span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="bg-slate-50/50 dark:bg-darkBg/60 border border-slate-100 dark:border-slate-800/40 rounded-xl p-3.5">
                  <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {req.message}
                  </p>
                </div>

                {/* Actions bar */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {req.status === 'Pending' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleMarkReviewed(req._id)}
                      className="gap-1 px-3 py-1.5 text-xs text-brand-emerald border border-brand-emerald/30 bg-brand-emerald/5 hover:bg-brand-emerald/10 dark:border-brand-emerald/50"
                      variant="outline"
                    >
                      <CheckCircle2 size={13} /> Mark Reviewed
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleDelete(req._id)}
                    className="text-brand-red hover:bg-brand-red/5 gap-1 px-3 py-1.5 text-xs"
                  >
                    <Trash2 size={13} /> Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrialRequests;
