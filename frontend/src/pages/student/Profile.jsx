import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Shield, Monitor, Key, Globe, Layout, CheckCircle2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form States
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingSecurity, setLoadingSecurity] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      const res = await api.patch('/users/profile', {
        fullName,
        phone
      });
      setUser(res.data.data);
      toast.success('Profile details updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile information.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('New password and confirmation fields do not match.');
    }

    setLoadingSecurity(true);
    try {
      // Direct console feedback on test passwords
      toast.success('Password update simulated successfully!', {
        icon: '🔑'
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error('Failed updating security passwords.');
    } finally {
      setLoadingSecurity(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: <User size={16} /> },
    { id: 'security', label: 'Security & Sign In', icon: <Shield size={16} /> }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-xs text-slate-450 dark:text-darkMuted">Manage details and configure security settings.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all relative ${
              activeTab === tab.id
                ? 'text-brand-blue border-b-2 border-brand-blue dark:text-brand-blueLight dark:border-brand-blueLight'
                : 'text-slate-400 dark:text-darkMuted hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="max-w-2xl">
        {activeTab === 'profile' && (
          <Card variant="default" className="p-6 md:p-8">
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-5">
                <div className="h-14 w-14 rounded-full bg-brand-blue/15 flex items-center justify-center text-brand-blue font-bold text-lg uppercase dark:bg-brand-blue/20 dark:text-brand-blueLight">
                  {user?.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-850 dark:text-white">{user?.fullName}</h3>
                  <p className="text-xs text-slate-400 dark:text-darkMuted">{user?.email}</p>
                </div>
              </div>

              <Input
                label="Full Name"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="Email Address (Locked)"
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
              />

              <Input
                label="Phone Number"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <Input
                label="Institution / Organization (Locked)"
                id="org"
                value={user?.organization || 'Stanford University'}
                disabled
              />

              <Button type="submit" loading={loadingProfile} className="w-full">
                Save Changes
              </Button>
            </form>
          </Card>
        )}

        {activeTab === 'security' && (
          <Card variant="default" className="p-6 md:p-8">
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="space-y-1 mb-6">
                <h3 className="text-sm font-bold text-slate-850 dark:text-white">Change Password</h3>
                <p className="text-xs text-slate-450 dark:text-darkMuted">Create a strong password to protect credentials.</p>
              </div>

              <Input
                label="Current Password"
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />

              <Input
                label="New Password"
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                label="Confirm New Password"
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button type="submit" loading={loadingSecurity} className="w-full">
                Change Password
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;
