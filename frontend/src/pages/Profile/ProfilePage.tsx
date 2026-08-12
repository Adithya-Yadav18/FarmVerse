import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { MdPerson, MdEdit, MdSave, MdPhone, MdLocationOn, MdEmail, MdBadge } from 'react-icons/md';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { Badge } from '../../components/ui/Badge/Badge';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../utils';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  location: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '', location: user?.location ?? '' },
  });

  const onSubmit = async (data: FormData) => {
    await new Promise(r => setTimeout(r, 600));
    updateUser(data);
    toast.success('Profile updated successfully');
    setEditing(false);
  };

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information and preferences."
        breadcrumbs={[{ label: 'Profile' }]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, maxWidth: 900 }}>
        {/* Avatar card */}
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '12px 0' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-gold), var(--color-emerald))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 800, color: '#fff',
              border: '4px solid rgba(212,175,55,0.3)',
              boxShadow: '0 0 0 8px rgba(212,175,55,0.1)',
            }}>
              {user ? initials(user.name) : 'U'}
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontWeight: 800, fontSize: 20, color: 'var(--text-primary)' }}>{user?.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>{user?.email}</p>
              <div style={{ marginTop: 10 }}>
                <Badge variant="success" dot>{user?.role}</Badge>
              </div>
            </div>

            <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
              {[
                { icon: <MdEmail size={16} />, label: user?.email ?? '—' },
                { icon: <MdPhone size={16} />, label: user?.phone ?? 'Not set' },
                { icon: <MdLocationOn size={16} />, label: user?.location ?? 'Not set' },
                { icon: <MdBadge size={16} />, label: user?.role ?? '—' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                  {item.icon} <span>{item.label}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '—'}
            </p>
          </div>
        </Card>

        {/* Edit form */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Personal Information</h3>
            {!editing && (
              <Button variant="outline" size="sm" leftIcon={<MdEdit />} onClick={() => setEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Input label="Full Name" {...register('name')} error={errors.name?.message} disabled={!editing} leftIcon={<MdPerson size={16} />} />
              <Input label="Email Address" type="email" {...register('email')} error={errors.email?.message} disabled={!editing} leftIcon={<MdEmail size={16} />} />
              <Input label="Phone Number" {...register('phone')} disabled={!editing} leftIcon={<MdPhone size={16} />} />
              <Input label="Location" {...register('location')} disabled={!editing} leftIcon={<MdLocationOn size={16} />} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Role</label>
              <div style={{ padding: '11px 14px', border: '1.5px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: 14 }}>
                {user?.role} (Cannot be changed here)
              </div>
            </div>

            {editing && (
              <div style={{ display: 'flex', gap: 10 }}>
                <Button type="submit" leftIcon={<MdSave />} loading={isSubmitting}>Save Changes</Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
