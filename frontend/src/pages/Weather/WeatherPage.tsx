import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MdWaterDrop, MdAir, MdCompress, MdUmbrella, MdSearch, MdSave } from 'react-icons/md';
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
  
  // Initialize city from user's saved profile region, or default to Bangalore
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  
  const initialCity = user?.location || 'Bangalore';
  const [searchQuery, setSearchQuery] = useState(initialCity);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const debouncedQuery = useDebounce(searchQuery, 400);

  // Fetch suggestions as user types
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length > 2) {
      api.get(`/weather/search?q=${debouncedQuery}`).then(res => setSuggestions(res.data));
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  // Fetch weather when a city is selected
  const fetchWeather = async (cityName: string) => {
    try {
      setLoading(true);
      setSuggestions([]);
      const res = await api.get(`/weather?city=${cityName}`);
      setWeather(res.data);
    } catch (error) {
      console.error("Failed to fetch weather", error);
      toast.error("Failed to fetch weather. Check if the city name is valid.");
    } finally {
      setLoading(false);
    }
  };

  // NEW: Save the currently viewed city to the user's profile
  const saveDefaultRegion = async () => {
    try {
      await authService.updateProfile({
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
        location: selectedCity // Save this city to DB!
      });
      updateUser({ ...user, location: selectedCity }); // Update frontend state
      toast.success(`${selectedCity} saved as your default region!`);
    } catch (error) {
      toast.error('Failed to save region.');
    }
  };

  useEffect(() => {
    fetchWeather(selectedCity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Weather Monitoring" subtitle="Real-time weather data and forecasts for your farm locations." breadcrumbs={[{ label: 'Weather' }]} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!weather || !weather.current) {
    return <div>Failed to load weather data.</div>;
  }

  const c = weather.current;
  const isSavedRegion = user?.location?.toLowerCase() === selectedCity.toLowerCase();

  return (
    <div style={{ position: 'relative' }}>
      <PageHeader
        title="Weather Monitoring"
        subtitle="Real-time weather data and forecasts for your farm locations."
        breadcrumbs={[{ label: 'Weather' }]}
      />

      {/* Search Bar with Autocomplete Dropdown */}
      <div style={{ position: 'relative', marginBottom: 20, display: 'flex', gap: 10 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Input 
            placeholder="Enter city or region (e.g., Visakha)" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setSelectedCity(searchQuery);
                fetchWeather(searchQuery);
              }
            }}
          />
          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 10, marginTop: 4, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {suggestions.map((sug, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    setSearchQuery(sug.displayName);
                    setSelectedCity(sug.displayName);
                    fetchWeather(sug.displayName);
                  }}
                  style={{
                    padding: '10px 14px', cursor: 'pointer',
                    borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-light)' : 'none',
                    color: 'var(--text-primary)', fontSize: 14
                  }}
                >
                  📍 {sug.displayName}
                </div>
              ))}
            </div>
          )}
        </div>
        <Button leftIcon={<MdSearch />} onClick={() => { setSelectedCity(searchQuery); fetchWeather(searchQuery); }}>Search</Button>
        
        {/* NEW: Save Default Region Button */}
        {!isSavedRegion && (
          <Button variant="outline" leftIcon={<MdSave />} onClick={saveDefaultRegion}>
            Set as Default
          </Button>
        )}
      </div>

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
            { icon: <MdWaterDrop />, label: 'Humidity', value: `${c.humidity}%` },
            { icon: <MdAir />, label: 'Wind', value: `${Math.round(c.windSpeed)} km/h ${c.windDirection}` },
            { icon: <MdCompress />, label: 'Pressure', value: `${Math.round(c.pressure)} hPa` },
            { icon: <MdUmbrella />, label: 'Precip.', value: `${c.precipitation} mm` },
          ].map(m => (
            <div key={m.label} className={styles.metricItem}>
              <span className={styles.metricIcon}>{m.icon}</span>
              <span className={styles.metricLabel}>{m.label}</span>
              <span className={styles.metricValue}>{m.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className={styles.grid}>
        {/* 7-day Forecast */}
        <Card>
          <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>7-Day Forecast</h3>
          <div className={styles.forecastList}>
            {weather.daily.map((d: any, i: number) => (
              <motion.div
                key={d.day}
                className={styles.forecastDay}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <span className={styles.forecastDayName}>{d.day}</span>
                <span className={styles.forecastIcon} style={{ fontSize: 24 }}>{d.emoji}</span>
                <span className={styles.forecastTemp}>{Math.round(d.high)}° / {Math.round(d.low)}°</span>
                <div className={styles.rainBar}>
                  <div className={styles.rainFill} style={{ width: `${d.rain}%` }} />
                </div>
                <span className={styles.rainPct}>{d.rain}%</span>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Temperature trend */}
        <Card>
          <h3 style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>Today's Temperature</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Hourly temperature trend (°C)</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weather.hourly} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
              <Line type="monotone" dataKey="temp" stroke="#D4AF37" strokeWidth={2.5} dot={{ fill: '#D4AF37', r: 4 }} name="Temp °C" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}