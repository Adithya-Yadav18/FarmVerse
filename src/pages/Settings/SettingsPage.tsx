import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { MdDarkMode, MdLightMode, MdNotifications, MdSecurity, MdLanguage } from 'react-icons/md';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { useTheme } from '../../context/ThemeContext';

interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; }
function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
        background: checked ? 'var(--color-emerald)' : 'var(--border-color)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3, width: 20, height: 20,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{ fontSize: 22, color: 'var(--color-emerald)' }}>{icon}</span>
      <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [notifs, setNotifs] = useState({ email: true, push: true, sms: false, alerts: true, reports: false, weather: true });
  const [privacy, setPrivacy] = useState({ twoFactor: false, activityLog: true });

  const save = () => toast.success('Settings saved');

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your account preferences and notification settings."
        breadcrumbs={[{ label: 'Settings' }]}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
        {/* Appearance */}
        <Card>
          <SectionHeader icon={theme === 'dark' ? <MdDarkMode /> : <MdLightMode />} title="Appearance" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border-light)' }}>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Dark Mode</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Switch between light and dark interface themes</p>
            </div>
            <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
          </div>

          <div style={{ padding: '14px 0' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Language</p>
            <select style={{ padding: '9px 14px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--border-radius)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}>
              <option>English (India)</option>
              <option>Hindi</option>
              <option>Tamil</option>
              <option>Telugu</option>
            </select>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <SectionHeader icon={<MdNotifications />} title="Notifications" />
          {([
            ['email', 'Email Notifications', 'Receive farm alerts and reports via email'],
            ['push', 'Push Notifications', 'Browser push notifications for critical alerts'],
            ['sms', 'SMS Alerts', 'Text messages for high-priority alerts'],
            ['alerts', 'Disease & Pest Alerts', 'Immediate alerts when disease or pests detected'],
            ['reports', 'Weekly Reports', 'Automated weekly farm summary emails'],
            ['weather', 'Weather Advisories', 'Severe weather and advisory notifications'],
          ] as [keyof typeof notifs, string, string][]).map(([key, label, desc]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</p>
              </div>
              <Toggle checked={notifs[key]} onChange={v => setNotifs(n => ({ ...n, [key]: v }))} />
            </div>
          ))}
        </Card>

        {/* Security */}
        <Card>
          <SectionHeader icon={<MdSecurity />} title="Security" />
          {([
            ['twoFactor', 'Two-Factor Authentication', 'Add an extra layer of security to your account'],
            ['activityLog', 'Activity Log', 'Keep track of all account activity'],
          ] as [keyof typeof privacy, string, string][]).map(([key, label, desc]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</p>
              </div>
              <Toggle checked={privacy[key]} onChange={v => setPrivacy(p => ({ ...p, [key]: v }))} />
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <Button variant="outline" size="sm">Change Password</Button>
          </div>
        </Card>

        <Button variant="primary" onClick={save}>Save All Settings</Button>
      </div>
    </div>
  );
}
