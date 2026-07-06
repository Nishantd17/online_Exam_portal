import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const Settings = () => {
  const [orgName, setOrgName] = useState('Stanford University');
  const [emailSender, setEmailSender] = useState('notifications@stanford.edu');
  
  // Proctor settings
  const [defaultTabLimit, setDefaultTabLimit] = useState(3);
  const [defaultPassPct, setDefaultPassPct] = useState(50);
  
  const [loading, setLoading] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Admin portal configuration settings saved successfully!');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Admin Portal Settings</h1>
        <p className="text-xs text-slate-450 dark:text-darkMuted">Audit global parameters and security thresholds.</p>
      </div>

      <div className="max-w-2xl">
        <Card variant="default" className="p-6 md:p-8">
          <form onSubmit={handleSaveSettings} className="space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Organization Settings</h3>
            
            <Input
              label="Organization Name"
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />

            <Input
              label="Default Sender Email Address"
              id="emailSender"
              type="email"
              value={emailSender}
              onChange={(e) => setEmailSender(e.target.value)}
              required
            />

            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2 mb-4 pt-4">Exam Integrity Defaults</h3>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tab switch threshold limit"
                id="defaultTabLimit"
                type="number"
                value={defaultTabLimit}
                onChange={(e) => setDefaultTabLimit(e.target.value)}
                required
              />
              <Input
                label="Default Passing percentage (%)"
                id="defaultPassPct"
                type="number"
                value={defaultPassPct}
                onChange={(e) => setDefaultPassPct(e.target.value)}
                required
              />
            </div>

            <Button type="submit" loading={loading} className="w-full mt-4">
              Save Settings Configuration
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
