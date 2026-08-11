import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MdCloud, MdWaterDrop, MdAir, MdVisibility, MdCompress, MdWbSunny, MdUmbrella } from 'react-icons/md';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Card } from '../../components/ui/Card/Card';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import styles from './WeatherPage.module.css';

const FORECAST = [
  { day: 'Mon', high: 32, low: 22, condition: '☀️', rain: 0 },
  { day: 'Tue', high: 29, low: 21, condition: '⛅', rain: 10 },
  { day: 'Wed', high: 27, low: 20, condition: '🌧️', rain: 65 },
  { day: 'Thu', high: 28, low: 21, condition: '🌦️', rain: 35 },
  { day: 'Fri', high: 31, low: 22, condition: '☀️', rain: 5 },
  { day: 'Sat', high: 33, low: 23, condition: '☀️', rain: 0 },
  { day: 'Sun', high: 30, low: 21, condition: '⛅', rain: 15 },
];

const TEMP_TREND = [
  { time: '6am', temp: 24 }, { time: '9am', temp: 27 },
  { time: '12pm', temp: 32 }, { time: '3pm', temp: 31 },
  { time: '6pm', temp: 28 }, { time: '9pm', temp: 25 },
];

export default function WeatherPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 700); }, []);

  return (
    <div>
      <PageHeader
        title="Weather Monitoring"
        subtitle="Real-time weather data and forecasts for your farm locations."
        breadcrumbs={[{ label: 'Weather' }]}
      />

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* Current Weather Hero */}
          <motion.div
            className={styles.currentWeather}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.currentMain}>
              <div>
                <p className={styles.location}>📍 North Valley Farm, Punjab</p>
                <div className={styles.tempRow}>
                  <span className={styles.temp}>32°C</span>
                  <div>
                    <p className={styles.condition}>Partly Cloudy</p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Feels like 36°C</p>
                  </div>
                </div>
              </div>
              <div className={styles.weatherIcon}>⛅</div>
            </div>
            <div className={styles.currentMetrics}>
              {[
                { icon: <MdWaterDrop />, label: 'Humidity', value: '68%' },
                { icon: <MdAir />, label: 'Wind', value: '14 km/h NE' },
                { icon: <MdVisibility />, label: 'Visibility', value: '10 km' },
                { icon: <MdCompress />, label: 'Pressure', value: '1012 hPa' },
                { icon: <MdWbSunny />, label: 'UV Index', value: '7 (High)' },
                { icon: <MdUmbrella />, label: 'Precip.', value: '12mm' },
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
                {FORECAST.map((d, i) => (
                  <motion.div
                    key={d.day}
                    className={styles.forecastDay}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <span className={styles.forecastDayName}>{d.day}</span>
                    <span className={styles.forecastIcon}>{d.condition}</span>
                    <span className={styles.forecastTemp}>{d.high}° / {d.low}°</span>
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
                <LineChart data={TEMP_TREND} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="time" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[20, 36]} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
                  <Line type="monotone" dataKey="temp" stroke="#D4AF37" strokeWidth={2.5} dot={{ fill: '#D4AF37', r: 4 }} name="Temp °C" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Farm-specific advisory */}
          <Card style={{ marginTop: 20 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 14, color: 'var(--text-primary)' }}>🌿 Agricultural Advisory</h3>
            <div className={styles.advisoryGrid}>
              {[
                { title: 'Irrigation', advice: 'Skip afternoon irrigation — rain expected Wednesday. Resume Thursday.', color: '#3B82F6' },
                { title: 'Pest Alert', advice: 'High humidity forecast increases aphid risk. Inspect crops Wednesday evening.', color: '#F59E0B' },
                { title: 'Harvest Window', advice: 'Saturday-Sunday ideal for harvesting — clear skies, low humidity.', color: '#0F5E3A' },
                { title: 'Fertilization', advice: 'Avoid fertilizer application Tuesday-Thursday due to heavy rain risk.', color: '#8B5CF6' },
              ].map(a => (
                <div key={a.title} className={styles.advisoryItem} style={{ borderLeftColor: a.color }}>
                  <h4 style={{ fontWeight: 700, color: a.color, marginBottom: 4 }}>{a.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>{a.advice}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
