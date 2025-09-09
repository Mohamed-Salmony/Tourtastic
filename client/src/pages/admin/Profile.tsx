import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface AdminProfileData {
  name: string;
  email: string;
  phone?: string;
}

const AdminProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AdminProfileData>({ name: '', email: '' });

  const configureAxios = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, [navigate]);

  useEffect(() => {
    (async () => {
      try {
        configureAxios();
        // This endpoint is a placeholder. Replace with your real admin profile endpoint if different.
        const res = await axios.get('/api/admin/profile');
        setForm({
          name: res.data?.data?.name || '',
          email: res.data?.data?.email || '',
          phone: res.data?.data?.phone || ''
        });
      } catch (_) {
        // Non-fatal for now; keep page usable.
      } finally {
        setLoading(false);
      }
    })();
  }, [configureAxios]);

  const onSave = async () => {
    try {
      setSaving(true);
      configureAxios();
      await axios.put('/api/admin/profile', form);
      // Ideally show a toast here; keeping it simple to avoid coupling.
      alert(t('admin.profile.saved', { defaultValue: 'Profile saved' }));
    } catch (err) {
      console.error(err);
      alert(t('admin.profile.saveError', { defaultValue: 'Could not save profile' }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tourtastic-blue" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.profile.title', { defaultValue: 'Admin Profile' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t('admin.profile.name', { defaultValue: 'Name' })}
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t('admin.profile.namePlaceholder', { defaultValue: 'Enter name' }) as string}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t('admin.profile.email', { defaultValue: 'Email' })}
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder={t('admin.profile.emailPlaceholder', { defaultValue: 'Enter email' }) as string}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t('admin.profile.phone', { defaultValue: 'Phone' })}
              </label>
              <Input
                value={form.phone || ''}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder={t('admin.profile.phonePlaceholder', { defaultValue: 'Enter phone' }) as string}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={onSave} disabled={saving}>
              {saving
                ? t('admin.profile.saving', { defaultValue: 'Saving...' })
                : t('admin.profile.save', { defaultValue: 'Save' })}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfile;
