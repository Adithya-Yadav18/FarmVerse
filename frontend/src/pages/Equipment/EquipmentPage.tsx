import React, { useState, useEffect, useMemo } from 'react';
import {
  MdPrecisionManufacturing,
  MdLocationOn,
  MdElectricBolt,
  MdVerified,
  MdCalendarMonth,
  MdAddCircleOutline,
  MdSearch,
  MdCheckCircle,
  MdCancel,
  MdOutlineAccessTime,
  MdPhone,
  MdPerson,
  MdSecurity,
  MdClose,
  MdMyLocation,
} from 'react-icons/md';
import { GiFarmTractor } from 'react-icons/gi';
import styles from './EquipmentPage.module.css';
import equipmentService from '../../services/equipmentService';
import { useAuth } from '../../context/AuthContext';
import type {
  EquipmentItem,
  EquipmentBooking,
  EquipmentCategory,
  CreateBookingPayload,
  CreateEquipmentPayload,
} from '../../types';

// Verified high-resolution agricultural machinery assets
const AGRICULTURAL_IMAGES = {
  RED_TRACTOR: 'https://images.unsplash.com/photo-1594771804886-a933bb2d609b?w=800&auto=format&fit=crop&q=80',
  GREEN_TRACTOR: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80',
  COMBINE_HARVESTER: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&auto=format&fit=crop&q=80',
  DRONE_SPRAYER: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80',
  ROTAVATOR: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=80',
  LASER_LEVELER: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
  WATER_PUMP: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=800&auto=format&fit=crop&q=80',
  BALER: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
};

const isMismatchedImage = (url: string | undefined): boolean => {
  if (!url) return true;
  return (
    url.includes('photo-1592878904946-b3cd8ae243d0') || // Suit
    url.includes('photo-1530595467537-0b5996c41f2d') || // Bear
    url.includes('photo-1509391365360-2e959784a276') || // 404 broken pump
    url.includes('photo-1544197150-b99a580bb7a8') || // LAN router / cables
    url.includes('photo-1500937386664-56d1dfef3854')    // People holding hands
  );
};

export const getCleanEquipmentImage = (item: { imageUrl?: string; category?: string; name?: string }): string => {
  const { imageUrl, category = '', name = '' } = item;
  if (!imageUrl || isMismatchedImage(imageUrl)) {
    const cat = category.toUpperCase();
    if (cat.includes('TRACTOR')) {
      return name.toLowerCase().includes('john deere')
        ? AGRICULTURAL_IMAGES.GREEN_TRACTOR
        : AGRICULTURAL_IMAGES.RED_TRACTOR;
    }
    if (cat.includes('HARVESTER')) return AGRICULTURAL_IMAGES.COMBINE_HARVESTER;
    if (cat.includes('DRONE')) return AGRICULTURAL_IMAGES.DRONE_SPRAYER;
    if (cat.includes('ROTAVATOR')) return AGRICULTURAL_IMAGES.ROTAVATOR;
    if (cat.includes('LEVELER')) return AGRICULTURAL_IMAGES.LASER_LEVELER;
    if (cat.includes('PUMP')) return AGRICULTURAL_IMAGES.WATER_PUMP;
    if (cat.includes('BALER')) return AGRICULTURAL_IMAGES.BALER;
    return AGRICULTURAL_IMAGES.RED_TRACTOR;
  }
  return imageUrl;
};

// Haversine calculation for exact real-time transit distance
const calculateHaversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

interface HubMapping {
  locationName: string;
  lat: number;
  lng: number;
  ownerName: string;
  ownerPhone: string;
}

const BIRMINGHAM_HUBS: Record<string, HubMapping> = {
  mahindra: {
    locationName: 'Solihull Agricultural Depot, West Midlands',
    lat: 52.4128,
    lng: -1.7782,
    ownerName: 'West Midlands Machinery Co-op (CHC)',
    ownerPhone: '+44 121 496 0192',
  },
  'john deere': {
    locationName: 'Sutton Coldfield Machinery Depot, Birmingham',
    lat: 52.5704,
    lng: -1.8240,
    ownerName: 'Midlands Farm Machinery Hire',
    ownerPhone: '+44 121 354 8821',
  },
  kubota: {
    locationName: 'Coleshill CHC Farm Machinery Hub, Warwickshire',
    lat: 52.4985,
    lng: -1.7062,
    ownerName: 'Warwickshire Grain & Harvest Contracting',
    ownerPhone: '+44 1675 463 990',
  },
  dji: {
    locationName: 'Warwickshire Precision Agri-Drone Hub, Kenilworth',
    lat: 52.3421,
    lng: -1.5833,
    ownerName: 'AeroCrop Precision Ag Services UK',
    ownerPhone: '+44 1926 852 114',
  },
  shaktiman: {
    locationName: 'Dudley & Stourbridge Tractor Implements, West Midlands',
    lat: 52.5123,
    lng: -2.0811,
    ownerName: 'Black Country Farm Implement Depot',
    ownerPhone: '+44 1384 241 550',
  },
  trimble: {
    locationName: 'Tamworth Farm Mechanization Center, Staffordshire',
    lat: 52.6340,
    lng: -1.6959,
    ownerName: 'Staffordshire Field Precision Drainage Ltd',
    ownerPhone: '+44 1827 709 332',
  },
  kirloskar: {
    locationName: 'Bromsgrove Farm Irrigation & Pump Station, Worcestershire',
    lat: 52.3353,
    lng: -2.0579,
    ownerName: 'Worcestershire Agricultural Irrigation Hub',
    ownerPhone: '+44 1527 874 120',
  },
  'new holland': {
    locationName: 'Lichfield Straw & Forage Equipment Center, Staffordshire',
    lat: 52.6835,
    lng: -1.8262,
    ownerName: 'Mercia Straw & Forage Hire',
    ownerPhone: '+44 1543 410 788',
  },
};

export default function EquipmentPage() {
  const { user } = useAuth();
  const rawLocation = user?.location || 'Birmingham';
  const isBirminghamUser = rawLocation.toLowerCase().includes('birmingham');

  const [activeTab, setActiveTab] = useState<'BROWSE' | 'MY_BOOKINGS' | 'OWNER_HUB'>('BROWSE');
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [myBookings, setMyBookings] = useState<EquipmentBooking[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<EquipmentBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Farmer location & coordinates state
  const [farmerCoords, setFarmerCoords] = useState<{ lat: number; lng: number; city: string }>({
    lat: isBirminghamUser ? 52.4862 : 12.5218,
    lng: isBirminghamUser ? -1.8904 : 76.8951,
    city: isBirminghamUser ? 'Birmingham, West Midlands' : rawLocation,
  });

  // Keep coords synced if user profile loads
  useEffect(() => {
    if (user?.location) {
      const isBham = user.location.toLowerCase().includes('birmingham');
      setFarmerCoords({
        lat: isBham ? 52.4862 : 12.5218,
        lng: isBham ? -1.8904 : 76.8951,
        city: isBham ? 'Birmingham, West Midlands' : user.location,
      });
    }
  }, [user?.location]);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(35);

  // Booking Modal State
  const [bookingModalItem, setBookingModalItem] = useState<EquipmentItem | null>(null);
  const [bookingForm, setBookingForm] = useState<CreateBookingPayload>({
    equipmentId: 0,
    renterName: user?.name || 'Thomas Shelby',
    renterPhone: user?.phone || '7989695949',
    deliveryAddress: `Farmstead, ${farmerCoords.city}`,
    startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    durationUnits: 3,
    rentalType: 'DAILY',
    withOperator: true,
    deliveryRequired: true,
    specialInstructions: '',
  });
  const [bookingSubmitting, setBookingSubmitting] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<EquipmentBooking | null>(null);

  // "List Equipment" Modal State
  const [showListModal, setShowListModal] = useState<boolean>(false);
  const [listForm, setListForm] = useState<CreateEquipmentPayload>({
    name: '',
    category: 'TRACTOR',
    brand: 'Mahindra',
    horsepower: 50,
    fuelType: 'DIESEL',
    hourlyRate: 800,
    dailyRate: 4000,
    securityDeposit: 2000,
    operatorIncluded: true,
    conditionStatus: 'EXCELLENT',
    locationName: farmerCoords.city,
    ownerName: user?.name || 'Thomas Shelby',
    ownerPhone: user?.phone || '7989695949',
    description: '',
    imageUrl: '',
  });

  const mapEquipmentForLocation = (
    item: EquipmentItem,
    userLat: number,
    userLng: number,
    isBham: boolean
  ): EquipmentItem => {
    let locationName = item.locationName;
    let latitude = item.latitude;
    let longitude = item.longitude;
    let ownerName = item.ownerName;
    let ownerPhone = item.ownerPhone;

    if (isBham) {
      const lowerName = item.name.toLowerCase();
      const matchedKey = Object.keys(BIRMINGHAM_HUBS).find(k => lowerName.includes(k));
      if (matchedKey) {
        const hub = BIRMINGHAM_HUBS[matchedKey];
        locationName = hub.locationName;
        latitude = hub.lat;
        longitude = hub.lng;
        ownerName = hub.ownerName;
        ownerPhone = hub.ownerPhone;
      } else if (
        item.locationName.includes('Karnataka') ||
        item.locationName.includes('Mandya') ||
        item.locationName.includes('Mysore')
      ) {
        locationName = 'West Midlands Central Agricultural Depot, Birmingham';
        latitude = 52.4862;
        longitude = -1.8904;
        ownerName = 'Birmingham CHC Machinery Center';
        ownerPhone = '+44 121 200 4000';
      }
    }

    const distanceKm = calculateHaversine(userLat, userLng, latitude, longitude);
    const imageUrl = getCleanEquipmentImage(item);

    return {
      ...item,
      locationName,
      latitude,
      longitude,
      distanceKm,
      ownerName,
      ownerPhone,
      imageUrl,
    };
  };

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const isBham = farmerCoords.city.toLowerCase().includes('birmingham');
      const [items, userBookings, incomingBookings] = await Promise.all([
        equipmentService.getAll({
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          search: searchQuery || undefined,
          maxDistanceKm: maxRadiusKm,
          lat: farmerCoords.lat,
          lng: farmerCoords.lng,
          location: farmerCoords.city,
        }),
        equipmentService.getMyBookings(),
        equipmentService.getOwnerBookings(),
      ]);

      const processedItems = items
        .map(item => mapEquipmentForLocation(item, farmerCoords.lat, farmerCoords.lng, isBham))
        .filter(item => item.distanceKm <= maxRadiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);

      setEquipmentList(processedItems);
      setMyBookings(
        userBookings.map(b => ({
          ...b,
          equipmentImageUrl: getCleanEquipmentImage({
            imageUrl: b.equipmentImageUrl,
            category: b.equipmentCategory,
            name: b.equipmentName,
          }),
        }))
      );
      setOwnerBookings(
        incomingBookings.map(b => ({
          ...b,
          equipmentImageUrl: getCleanEquipmentImage({
            imageUrl: b.equipmentImageUrl,
            category: b.equipmentCategory,
            name: b.equipmentName,
          }),
        }))
      );
    } catch (err) {
      console.error('Error fetching farm equipment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, maxRadiusKm, farmerCoords.lat, farmerCoords.lng]);

  const handleDetectGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setFarmerCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            city: `Current GPS (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`,
          });
        },
        err => {
          console.warn('GPS detection failed:', err.message);
          alert('GPS detection unavailable. Using registered profile location: ' + farmerCoords.city);
        }
      );
    }
  };

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Open booking modal
  const handleOpenBooking = (item: EquipmentItem) => {
    setBookingModalItem(item);
    setBookingSuccess(null);
    setBookingForm(prev => ({
      ...prev,
      equipmentId: item.id,
      withOperator: item.operatorIncluded,
      renterName: user?.name || prev.renterName || 'Thomas Shelby',
      renterPhone: user?.phone || prev.renterPhone || '7989695949',
      deliveryAddress: `Farmstead, ${farmerCoords.city}`,
    }));
  };

  // Calculate live booking totals
  const livePriceCalculation = useMemo(() => {
    if (!bookingModalItem) return { rent: 0, deposit: 0, total: 0 };
    const rate =
      bookingForm.rentalType === 'HOURLY'
        ? bookingModalItem.hourlyRate
        : bookingModalItem.dailyRate;
    const rent = rate * (bookingForm.durationUnits || 1);
    const deposit = bookingModalItem.securityDeposit || 0;
    return {
      rent,
      deposit,
      total: rent + deposit,
    };
  }, [bookingModalItem, bookingForm.rentalType, bookingForm.durationUnits]);

  // Submit Booking
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalItem) return;
    setBookingSubmitting(true);
    try {
      const res = await equipmentService.book(bookingModalItem.id, bookingForm);
      setBookingSuccess(res);
      fetchData();
    } catch (err) {
      console.error('Failed to submit booking:', err);
      alert('Unable to complete booking. Please verify details and try again.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Submit New Equipment Listing
  const handleListSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await equipmentService.create(listForm);
      setShowListModal(false);
      fetchData();
      alert('Equipment listed successfully in the FarmVerse CHC Marketplace!');
    } catch (err) {
      console.error('Failed to list equipment:', err);
      alert('Error creating listing.');
    }
  };

  // Approve / Reject Owner booking
  const handleStatusUpdate = async (bookingId: number, status: string) => {
    try {
      await equipmentService.updateBookingStatus(bookingId, { status });
      fetchData();
    } catch (err) {
      console.error('Failed to update booking status:', err);
    }
  };

  const categories = [
    { key: 'ALL', label: 'All Equipment' },
    { key: 'TRACTOR', label: '🚜 Tractors' },
    { key: 'COMBINE_HARVESTER', label: '🌾 Harvesters' },
    { key: 'DRONE_SPRAYER', label: '🚁 Drone Sprayers' },
    { key: 'ROTAVATOR', label: '⚙️ Rotavators' },
    { key: 'LASER_LEVELER', label: '📐 Laser Levelers' },
    { key: 'WATER_PUMP', label: '💧 Water Pumps' },
    { key: 'BALER', label: '📦 Balers' },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>
            <GiFarmTractor color="#2d6a4f" />
            Farm Equipment & CHC Hiring Marketplace
          </h1>
          <p className={styles.headerSubtitle}>
            Rent high-efficiency tractors, combine harvesters, drone sprayers, and implements on an hourly or daily basis from verified local Custom Hiring Centers (CHC) and fellow farmers.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.primaryBtn} onClick={() => setShowListModal(true)}>
            <MdAddCircleOutline size={18} />
            List My Equipment
          </button>
        </div>
      </header>

      {/* Real-time Location & Radius Status Banner */}
      <div className={styles.locationBanner}>
        <div className={styles.locationInfo}>
          <span className={styles.locationPulse}></span>
          <div>
            <span className={styles.locationLabel}>Active Farmer Location:</span>
            <span className={styles.locationCity}>📍 {farmerCoords.city}</span>
            <span className={styles.locationCoords}>
              ({farmerCoords.lat.toFixed(4)}° N, {Math.abs(farmerCoords.lng).toFixed(4)}° {farmerCoords.lng < 0 ? 'W' : 'E'})
            </span>
          </div>
        </div>
        <div className={styles.locationRight}>
          <span className={styles.locationRadiusBadge}>
            Showing verified hiring hubs within {maxRadiusKm} km
          </span>
          <button className={styles.detectGpsBtn} onClick={handleDetectGps} title="Detect live GPS coordinates">
            <MdMyLocation size={16} /> Use My Live GPS
          </button>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className={styles.statsRibbon}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap}>
            <MdPrecisionManufacturing />
          </div>
          <div className={styles.statInfo}>
            <h4>{equipmentList.length} Units</h4>
            <p>Available Within {maxRadiusKm} km</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: '#e3f2fd', color: '#1565c0' }}>
            <MdCalendarMonth />
          </div>
          <div className={styles.statInfo}>
            <h4>{myBookings.length} Bookings</h4>
            <p>My Active & Past Rentals</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: '#fff3e0', color: '#e65100' }}>
            <MdVerified />
          </div>
          <div className={styles.statInfo}>
            <h4>100% Tested</h4>
            <p>Inspection & Operator Certified</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: '#f3e5f5', color: '#7b1fa2' }}>
            <MdElectricBolt />
          </div>
          <div className={styles.statInfo}>
            <h4>Up to 70%</h4>
            <p>Cost Saved vs Machine Ownership</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'BROWSE' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('BROWSE')}
        >
          <MdSearch size={18} />
          Browse Machinery ({equipmentList.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'MY_BOOKINGS' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('MY_BOOKINGS')}
        >
          <MdCalendarMonth size={18} />
          My Rental Bookings
          {myBookings.length > 0 && <span className={styles.badgePill}>{myBookings.length}</span>}
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'OWNER_HUB' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('OWNER_HUB')}
        >
          <MdVerified size={18} />
          Owner Approval Hub
          {ownerBookings.length > 0 && <span className={styles.badgePill}>{ownerBookings.length}</span>}
        </button>
      </div>

      {/* Tab 1: Browse Equipment */}
      {activeTab === 'BROWSE' && (
        <>
          {/* Controls Bar */}
          <div className={styles.controlsBar}>
            <div className={styles.controlsTop}>
              <form className={styles.searchInputWrap} onSubmit={handleSearchSubmit}>
                <MdSearch size={20} color="#557565" />
                <input
                  type="text"
                  placeholder="Search by brand, tractor model, implement, or city..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </form>

              <div className={styles.radiusFilter}>
                <label>Radius: {maxRadiusKm} km</label>
                <input
                  type="range"
                  min="5"
                  max="75"
                  step="5"
                  value={maxRadiusKm}
                  onChange={e => setMaxRadiusKm(Number(e.target.value))}
                  className={styles.radiusSlider}
                />
              </div>
            </div>

            <div className={styles.categoryChips}>
              {categories.map(cat => (
                <button
                  key={cat.key}
                  className={`${styles.chip} ${selectedCategory === cat.key ? styles.chipActive : ''}`}
                  onClick={() => setSelectedCategory(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>Finding available farm machinery nearby...</p>
            </div>
          ) : equipmentList.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🚜</div>
              <h3 className={styles.emptyTitle}>No Equipment Found Nearby</h3>
              <p className={styles.emptyText}>
                Try expanding your search radius or selecting another machinery category.
              </p>
            </div>
          ) : (
            <div className={styles.equipmentGrid}>
              {equipmentList.map(item => (
                <div key={item.id} className={styles.card}>
                  <div className={styles.cardImageWrap}>
                    <img
                      src={getCleanEquipmentImage(item)}
                      alt={item.name}
                      className={styles.cardImage}
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).src = getCleanEquipmentImage(item);
                      }}
                    />
                    <span className={styles.conditionBadge}>{item.conditionStatus}</span>
                    <span className={styles.distanceBadge}>
                      <MdLocationOn /> {item.distanceKm} km away
                    </span>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardCategory}>{item.category.replace('_', ' ')}</div>
                    <h3 className={styles.cardTitle}>{item.name}</h3>
                    <div className={styles.cardLocation}>
                      <MdLocationOn size={15} /> {item.locationName}
                    </div>

                    <div className={styles.specsPills}>
                      <span className={styles.specPill}>⚡ {item.horsepower} HP</span>
                      <span className={styles.specPill}>⛽ {item.fuelType}</span>
                      <span className={styles.specPill}>
                        {item.operatorIncluded ? '👤 With Operator' : '🔧 Self-Operated'}
                      </span>
                    </div>

                    <p className={styles.cardDescription}>{item.description}</p>

                    <div className={styles.ratesRow}>
                      <div className={styles.rateUnit}>
                        <span className={styles.rateLabel}>Hourly Rate</span>
                        <div className={styles.rateAmount}>
                          ₹{item.hourlyRate.toLocaleString()} <span>/hr</span>
                        </div>
                      </div>
                      <div className={styles.rateUnit} style={{ textAlign: 'right' }}>
                        <span className={styles.rateLabel}>Daily Rate</span>
                        <div className={styles.rateAmount}>
                          ₹{item.dailyRate.toLocaleString()} <span>/day</span>
                        </div>
                      </div>
                    </div>

                    <button className={styles.bookBtn} onClick={() => handleOpenBooking(item)}>
                      <MdCalendarMonth size={18} />
                      Book Equipment Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab 2: My Bookings */}
      {activeTab === 'MY_BOOKINGS' && (
        <div className={styles.bookingsList}>
          {myBookings.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📅</div>
              <h3 className={styles.emptyTitle}>No Rental Bookings Yet</h3>
              <p className={styles.emptyText}>
                Browse available machinery and reserve your first piece of equipment with zero hassle.
              </p>
            </div>
          ) : (
            myBookings.map(b => (
              <div key={b.id} className={styles.bookingCard}>
                <div className={styles.bookingLeft}>
                  <img
                    src={getCleanEquipmentImage({
                      imageUrl: b.equipmentImageUrl,
                      category: b.equipmentCategory,
                      name: b.equipmentName,
                    })}
                    alt={b.equipmentName}
                    className={styles.bookingImg}
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src = getCleanEquipmentImage({
                        imageUrl: b.equipmentImageUrl,
                        category: b.equipmentCategory,
                        name: b.equipmentName,
                      });
                    }}
                  />
                  <div>
                    <h4 className={styles.bookingTitle}>{b.equipmentName}</h4>
                    <div className={styles.bookingMeta}>
                      <span>Ref: <strong>{b.bookingReference}</strong></span>
                      <span>
                        Dates: {b.startDate} to {b.endDate} ({b.durationUnits} {b.rentalType.toLowerCase()})
                      </span>
                      <span>
                        Operator: {b.withOperator ? '✅ Included' : '❌ No'}
                      </span>
                      <span>📍 {b.deliveryAddress}</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`${styles.statusTag} ${styles['status' + b.status]}`}>
                    {b.status.replace('_', ' ')}
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#1b4332', marginTop: 8 }}>
                    ₹{b.totalRentalAmount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#688577' }}>
                    + ₹{b.securityDeposit.toLocaleString()} Deposit (Refundable)
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Owner Hub */}
      {activeTab === 'OWNER_HUB' && (
        <div className={styles.bookingsList}>
          {ownerBookings.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👑</div>
              <h3 className={styles.emptyTitle}>No Incoming Rental Requests</h3>
              <p className={styles.emptyText}>
                When other farmers book your listed machinery, their reservation requests will appear here for approval.
              </p>
            </div>
          ) : (
            ownerBookings.map(b => (
              <div key={b.id} className={styles.bookingCard}>
                <div className={styles.bookingLeft}>
                  <img
                    src={getCleanEquipmentImage({
                      imageUrl: b.equipmentImageUrl,
                      category: b.equipmentCategory,
                      name: b.equipmentName,
                    })}
                    alt={b.equipmentName}
                    className={styles.bookingImg}
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src = getCleanEquipmentImage({
                        imageUrl: b.equipmentImageUrl,
                        category: b.equipmentCategory,
                        name: b.equipmentName,
                      });
                    }}
                  />
                  <div>
                    <h4 className={styles.bookingTitle}>{b.equipmentName}</h4>
                    <div className={styles.bookingMeta}>
                      <span>Renter: <strong>{b.renterName}</strong> ({b.renterPhone})</span>
                      <span>Dates: {b.startDate} to {b.endDate}</span>
                      <span>Total: ₹{b.totalRentalAmount.toLocaleString()}</span>
                    </div>
                    {b.specialInstructions && (
                      <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#406352' }}>
                        Note: <em>"{b.specialInstructions}"</em>
                      </p>
                    )}
                  </div>
                </div>

                <div className={styles.bookingActions}>
                  <span className={`${styles.statusTag} ${styles['status' + b.status]}`}>
                    {b.status.replace('_', ' ')}
                  </span>
                  {b.status === 'PENDING_APPROVAL' && (
                    <>
                      <button
                        className={styles.approveBtn}
                        onClick={() => handleStatusUpdate(b.id, 'APPROVED')}
                      >
                        <MdCheckCircle size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        Approve
                      </button>
                      <button
                        className={styles.rejectBtn}
                        onClick={() => handleStatusUpdate(b.id, 'REJECTED')}
                      >
                        <MdCancel size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        Reject
                      </button>
                    </>
                  )}
                  {b.status === 'APPROVED' && (
                    <button
                      className={styles.approveBtn}
                      style={{ background: '#1565c0' }}
                      onClick={() => handleStatusUpdate(b.id, 'COMPLETED')}
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Book Equipment */}
      {bookingModalItem && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Book Farm Equipment</h3>
              <button className={styles.closeBtn} onClick={() => setBookingModalItem(null)}>
                <MdClose />
              </button>
            </div>

            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 50, color: '#2e7d32', marginBottom: 12 }}>🎉</div>
                <h3 style={{ margin: '0 0 8px 0', color: '#1b4332' }}>Booking Confirmed!</h3>
                <p style={{ color: '#4b6658', fontSize: 14 }}>
                  Reference Number: <strong>{bookingSuccess.bookingReference}</strong>
                </p>
                <div className={styles.costBreakdown}>
                  <div className={styles.costRow}>
                    <span>Equipment:</span>
                    <strong>{bookingSuccess.equipmentName}</strong>
                  </div>
                  <div className={styles.costRow}>
                    <span>Duration:</span>
                    <span>{bookingSuccess.durationUnits} {bookingSuccess.rentalType.toLowerCase()}</span>
                  </div>
                  <div className={styles.costRow}>
                    <span>Total Rent:</span>
                    <span>₹{bookingSuccess.totalRentalAmount.toLocaleString()}</span>
                  </div>
                  <div className={styles.costRow}>
                    <span>Security Deposit (Refundable):</span>
                    <span>₹{bookingSuccess.securityDeposit.toLocaleString()}</span>
                  </div>
                  <div className={styles.costTotal}>
                    <span>Total Amount:</span>
                    <span>₹{(bookingSuccess.totalRentalAmount + bookingSuccess.securityDeposit).toLocaleString()}</span>
                  </div>
                </div>
                <button
                  className={styles.primaryBtn}
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setBookingModalItem(null);
                    setActiveTab('MY_BOOKINGS');
                  }}
                >
                  View My Bookings
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 }}>
                  <img
                    src={getCleanEquipmentImage(bookingModalItem)}
                    alt={bookingModalItem.name}
                    style={{ width: 70, height: 70, borderRadius: 10, objectFit: 'cover' }}
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src = getCleanEquipmentImage(bookingModalItem);
                    }}
                  />
                  <div>
                    <h4 style={{ margin: 0, color: '#1b4332', fontSize: 16 }}>{bookingModalItem.name}</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: 13, color: '#688577' }}>
                      {bookingModalItem.brand} • {bookingModalItem.horsepower} HP • {bookingModalItem.locationName}
                    </p>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Rental Type</label>
                    <select
                      className={styles.formSelect}
                      value={bookingForm.rentalType}
                      onChange={e =>
                        setBookingForm(prev => ({
                          ...prev,
                          rentalType: e.target.value as 'DAILY' | 'HOURLY',
                        }))
                      }
                    >
                      <option value="DAILY">Daily (₹{bookingModalItem.dailyRate.toLocaleString()} / day)</option>
                      <option value="HOURLY">Hourly (₹{bookingModalItem.hourlyRate.toLocaleString()} / hr)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Duration ({bookingForm.rentalType === 'HOURLY' ? 'Hours' : 'Days'})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      className={styles.formInput}
                      value={bookingForm.durationUnits}
                      onChange={e =>
                        setBookingForm(prev => ({
                          ...prev,
                          durationUnits: Number(e.target.value),
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Start Date</label>
                    <input
                      type="date"
                      className={styles.formInput}
                      value={bookingForm.startDate}
                      onChange={e => setBookingForm(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>End Date</label>
                    <input
                      type="date"
                      className={styles.formInput}
                      value={bookingForm.endDate}
                      onChange={e => setBookingForm(prev => ({ ...prev, endDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Farm Delivery / Dispatch Address</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={bookingForm.deliveryAddress}
                    onChange={e => setBookingForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                    placeholder="Enter your field location or village survey number"
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Contact Farmer Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={bookingForm.renterName}
                      onChange={e => setBookingForm(prev => ({ ...prev, renterName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Phone Number</label>
                    <input
                      type="tel"
                      className={styles.formInput}
                      value={bookingForm.renterPhone}
                      onChange={e => setBookingForm(prev => ({ ...prev, renterPhone: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 20, margin: '14px 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={bookingForm.withOperator}
                      onChange={e => setBookingForm(prev => ({ ...prev, withOperator: e.target.checked }))}
                    />
                    Request Certified Driver / Operator
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={bookingForm.deliveryRequired}
                      onChange={e => setBookingForm(prev => ({ ...prev, deliveryRequired: e.target.checked }))}
                    />
                    Doorstep Field Delivery Required
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Special Agricultural Instructions (Optional)</label>
                  <textarea
                    className={styles.formTextarea}
                    rows={2}
                    value={bookingForm.specialInstructions || ''}
                    onChange={e => setBookingForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    placeholder="e.g. Deep tilling for sugarcane planting, 3-acre area, loose black soil"
                  />
                </div>

                {/* Price Breakdown */}
                <div className={styles.costBreakdown}>
                  <div className={styles.costRow}>
                    <span>
                      Rental Cost ({bookingForm.durationUnits}{' '}
                      {bookingForm.rentalType === 'HOURLY' ? 'hrs' : 'days'}):
                    </span>
                    <span>₹{livePriceCalculation.rent.toLocaleString()}</span>
                  </div>
                  <div className={styles.costRow}>
                    <span>Security Deposit (100% Refundable):</span>
                    <span>₹{livePriceCalculation.deposit.toLocaleString()}</span>
                  </div>
                  <div className={styles.costTotal}>
                    <span>Total Amount Payable:</span>
                    <span>₹{livePriceCalculation.total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.primaryBtn}
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={bookingSubmitting}
                >
                  {bookingSubmitting ? 'Confirming Reservation...' : 'Confirm & Reserve Machine'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: List My Equipment */}
      {showListModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>List Equipment for Rent</h3>
              <button className={styles.closeBtn} onClick={() => setShowListModal(false)}>
                <MdClose />
              </button>
            </div>

            <form onSubmit={handleListSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Machinery Name & Model</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Mahindra 575 DI Sarpanch 4WD"
                  value={listForm.name}
                  onChange={e => setListForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select
                    className={styles.formSelect}
                    value={listForm.category}
                    onChange={e => setListForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="TRACTOR">Tractor</option>
                    <option value="COMBINE_HARVESTER">Combine Harvester</option>
                    <option value="DRONE_SPRAYER">Drone Sprayer</option>
                    <option value="ROTAVATOR">Rotavator / Cultivator</option>
                    <option value="LASER_LEVELER">Laser Land Leveler</option>
                    <option value="WATER_PUMP">Water Pump</option>
                    <option value="BALER">Straw Baler</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Brand / Manufacturer</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. John Deere, Mahindra, Kubota"
                    value={listForm.brand}
                    onChange={e => setListForm(prev => ({ ...prev, brand: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Horsepower (HP)</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={listForm.horsepower}
                    onChange={e => setListForm(prev => ({ ...prev, horsepower: Number(e.target.value) }))}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Fuel / Power Type</label>
                  <select
                    className={styles.formSelect}
                    value={listForm.fuelType}
                    onChange={e => setListForm(prev => ({ ...prev, fuelType: e.target.value }))}
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="ELECTRIC">Electric / Battery</option>
                    <option value="SOLAR">Solar</option>
                    <option value="PETROL">Petrol</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hourly Rate (₹/hr)</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={listForm.hourlyRate}
                    onChange={e => setListForm(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Daily Rate (₹/day)</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={listForm.dailyRate}
                    onChange={e => setListForm(prev => ({ ...prev, dailyRate: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Security Deposit (₹)</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={listForm.securityDeposit}
                    onChange={e => setListForm(prev => ({ ...prev, securityDeposit: Number(e.target.value) }))}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Location / District</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Mandya, Karnataka"
                    value={listForm.locationName}
                    onChange={e => setListForm(prev => ({ ...prev, locationName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description & Features</label>
                <textarea
                  className={styles.formTextarea}
                  rows={3}
                  placeholder="Describe your equipment condition, accessories, power steering, implement compatibility..."
                  value={listForm.description}
                  onChange={e => setListForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <button
                type="submit"
                className={styles.primaryBtn}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Publish Equipment to Marketplace
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
