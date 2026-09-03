import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MdWaterDrop, MdAir, MdCompress, MdUmbrella, MdSearch, MdSave, MdLocationSearching } from 'react-icons/md';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Card } from '../../components/ui/Card/Card';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import api from '../../services/api';
import styles from './WeatherPage.module.css';

export default function WeatherPage() {
  const { user, updateUser } = useAuth();
  
  // Initialize city from user's saved profile region (no hardcoded foreign defaults!)
  const initialCity = user?.location || user?.region || '';
  const [loading, setLoading] = useState(Boolean(initialCity));
  const [weather, setWeather] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState(initialCity);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const debouncedQuery = useDebounce(searchQuery, 400);

  // Fetch suggestions as user types
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.trim().length > 2) {
      api.get(`/weather/search?q=${encodeURIComponent(debouncedQuery.trim())}`)
        .then(res => setSuggestions(res.data || []))
        .catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  // Fetch weather when a city is selected
  const fetchWeather = async (cityName: string) => {
    if (!cityName || cityName.trim().length < 2) return;
    try {
      setLoading(true);
      setSuggestions([]);
      const cleanCity = cityName.trim().split(',')[0].trim();
      const res = await api.get(`/weather?city=${encodeURIComponent(cleanCity)}`);
      setWeather(res.data);
      setSelectedCity(cleanCity);
    } catch (error: any) {
      console.error("Failed to fetch weather", error);
      const msg = error.response?.data?.message || `Could not find weather data for "${cityName}". Try searching by city name.`;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Save the currently viewed city to the user's profile
  const saveDefaultRegion = async () => {
    if (!selectedCity) return;
    try {
      await authService.updateProfile({
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
        location: selectedCity
      });
      updateUser({ ...user, location: selectedCity });
      toast.success(`${selectedCity} saved as your default region!`);
    } catch (error) {
      toast.error('Failed to save region.');
    }
  };

  useEffect(() => {
    if (initialCity) {
      fetchWeather(initialCity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCity]);

  const handleManualSearch = () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a city or region name');
      return;
    }
    const cleanCity = searchQuery.trim().split(',')[0].trim();
    setSelectedCity(cleanCity);
    fetchWeather(cleanCity);
  };

  const isSavedRegion = Boolean(
    user?.location && selectedCity && user.location.toLowerCase() === selectedCity.toLowerCase()
  );
  const c = weather?.current;

  return (
    <div style={{ position: 'relative' }}>
      <PageHeader
        title="Weather Monitoring"
        subtitle="Real-time agro-meteorological data, rain risk, and 7-day forecast for your farm location."
        breadcrumbs={[{ label: 'Weather' }]}
      />

      {/* Search Bar with Autocomplete Dropdown */}
      <div style={{ position: 'relative', marginBottom: 24, display: 'flex', gap: 10 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Input 
            placeholder="Enter city, district or state (e.g., Punjab, Ludhiana, Coimbatore, Pune)" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleManualSearch();
              }
            }}
          />
          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 10, marginTop: 4, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
            }}>
              {suggestions.map((sug, i) => {
                const label = sug.region ? `${sug.name}, ${sug.region}, ${sug.country}` : `${sug.name}, ${sug.country}`;
                return (
                  <div 
                    key={i} 
                    onClick={() => {
                      setSearchQuery(label);
                      setSelectedCity(sug.name);
                      fetchWeather(sug.name);
                    }}
                    style={{
                      padding: '11px 14px', cursor: 'pointer',
                      borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-color)' : 'none',
                      color: 'var(--text-primary)', fontSize: 14,
                      display: 'flex', alignItems: 'center', gap: 8
                    }}
                  >
                    📍 {label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <Button leftIcon={<MdSearch />} onClick={handleManualSearch}>Search</Button>
        
        {/* Save Default Region Button */}
        {selectedCity && !isSavedRegion && (
          <Button variant="outline" leftIcon={<MdSave />} onClick={saveDefaultRegion}>
            Set as Default
          </Button>
        )}
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && !weather && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: 16, border: '1px dashed var(--border-color)', marginTop: 10 }}>
          <MdLocationSearching size={54} style={{ opacity: 0.4, marginBottom: 14, color: 'var(--color-emerald)' }} />
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Search Your Farm Region</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 16px', lineHeight: 1.6 }}>
            No default location is set for this account yet. Search your city or farm district above to view live agro-weather, humidity, and 7-day rainfall forecasts.
          </p>
        </div>
      )}

      {!loading && c && (
        <>
          {/* Current Weather Hero */}
          <motion.div
            className={styles.currentWeather}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.currentMain}>
              <div>
                <p className={styles.location}>📍 {c.cityName}</p>
                <div className={styles.tempRow}>
                  <span className={styles.temp}>{Math.round(c.temperature)}°C</span>
                  <div>
                    <p className={styles.condition}>{c.description}</p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Feels like {Math.round(c.feelsLike)}°C</p>
                  </div>
                </div>
              </div>
              <div className={styles.weatherIcon} style={{ fontSize: 64 }}>{c.emoji}</div>
            </div>
            <div className={styles.currentMetrics}>
              {[
                { icon: <MdWaterDrop size={20} />, label: 'Humidity', value: `${c.humidity}%` },
                { icon: <MdAir size={20} />, label: 'Wind', value: `${c.windSpeed} km/h ${c.windDirection}` },
                { icon: <MdCompress size={20} />, label: 'Pressure', value: `${c.pressure} hPa` },
                { icon: <MdUmbrella size={20} />, label: 'Precip.', value: `${c.precipitation} mm` },
              ].map(m => (
                <div key={m.label} className={styles.metricItem}>
                  <span className={styles.metricIcon}>{m.icon}</span>
                  <div>
                    <span className={styles.metricLabel}>{m.label}</span>
                    <span className={styles.metricVal}>{m.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className={styles.contentGrid}>
            {/* 7-Day Forecast */}
            <Card>
              <h3 className={styles.sectionTitle}>7-Day Forecast</h3>
              <div className={styles.dailyList}>
                {weather.daily?.map((d: any, i: number) => (
                  <div key={i} className={styles.dailyRow}>
                    <span className={styles.dailyDay}>{d.day}</span>
                    <span className={styles.dailyEmoji}>{d.emoji}</span>
                    <span className={styles.dailyTemps}>{Math.round(d.high)}° / {Math.round(d.low)}°</span>
                    <div className={styles.rainBar}>
                      <div className={styles.rainFill} style={{ width: `${d.rain}%` }} />
                    </div>
                    <span className={styles.rainPercent}>{d.rain}%</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Hourly Temperature Chart */}
            <Card>
              <h3 className={styles.sectionTitle}>Today's Temperature</h3>
              <p className={styles.sectionSub}>Hourly temperature trend (°C)</p>
              <div style={{ height: 260, marginTop: 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weather.hourly || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="time" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} domain={['auto', 'auto']} unit="°" />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }}
                      labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Line type="monotone" dataKey="temp" stroke="#D4AF37" strokeWidth={2.5} dot={{ fill: '#D4AF37', r: 3 }} name="Temp (°C)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}