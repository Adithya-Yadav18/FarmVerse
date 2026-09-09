package com.farmverse.backend.service;

import com.farmverse.backend.dto.EquipmentDTO;
import com.farmverse.backend.entity.EquipmentBookingEntity;
import com.farmverse.backend.entity.EquipmentEntity;
import com.farmverse.backend.entity.User;
import com.farmverse.backend.repository.EquipmentBookingRepository;
import com.farmverse.backend.repository.EquipmentRepository;
import com.farmverse.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentBookingRepository bookingRepository;
    private final UserRepository userRepository;

    // Default reference coordinates (Mandya / Cauvery Basin agricultural heartland)
    private static final double DEFAULT_LAT = 12.5218;
    private static final double DEFAULT_LNG = 76.8951;

    @PostConstruct
    public void init() {
        if (equipmentRepository.count() == 0) {
            seedEquipmentCatalog();
        } else {
            fixOutdatedCatalogImages();
        }
    }

    @Transactional
    public void fixOutdatedCatalogImages() {
        List<EquipmentEntity> all = equipmentRepository.findAll();
        boolean changed = false;
        for (EquipmentEntity eq : all) {
            String img = eq.getImageUrl();
            if (img == null || isBadImage(img)) {
                eq.setImageUrl(sanitizeImage(img, eq.getCategory(), eq.getName()));
                changed = true;
            }
        }
        if (changed) {
            equipmentRepository.saveAll(all);
            log.info("Successfully updated legacy equipment catalog images with verified agricultural photos.");
        }
    }

    private boolean isBadImage(String img) {
        if (img == null) return true;
        return img.contains("photo-1592878904946-b3cd8ae243d0")  // Suit
                || img.contains("photo-1530595467537-0b5996c41f2d")  // Bear
                || img.contains("photo-1509391365360-2e959784a276")  // 404 broken pump
                || img.contains("photo-1544197150-b99a580bb7a8")  // LAN router / cables
                || img.contains("photo-1500937386664-56d1dfef3854"); // Holding hands in field
    }

    private String sanitizeImage(String img, String category, String name) {
        if (img == null || isBadImage(img)) {
            String cat = category != null ? category.toUpperCase() : "";
            if (cat.contains("TRACTOR")) {
                return (name != null && name.contains("John Deere"))
                        ? "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80"
                        : "https://images.unsplash.com/photo-1594771804886-a933bb2d609b?w=800&auto=format&fit=crop&q=80";
            } else if (cat.contains("HARVESTER")) {
                return "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&auto=format&fit=crop&q=80";
            } else if (cat.contains("DRONE")) {
                return "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80";
            } else if (cat.contains("ROTAVATOR")) {
                return "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=80";
            } else if (cat.contains("LEVELER")) {
                return "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80";
            } else if (cat.contains("PUMP")) {
                return "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=800&auto=format&fit=crop&q=80";
            } else if (cat.contains("BALER")) {
                return "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80";
            } else {
                return "https://images.unsplash.com/photo-1594771804886-a933bb2d609b?w=800&auto=format&fit=crop&q=80";
            }
        }
        return img;
    }

    @Transactional
    public void seedEquipmentCatalog() {
        log.info("Seeding initial high-performance Farm Equipment & CHC Hub Machinery...");
        User defaultOwner = userRepository.findAll().stream().findFirst().orElse(null);

        List<EquipmentEntity> catalog = List.of(
                EquipmentEntity.builder()
                        .name("Mahindra 575 DI Sarpanch 4WD")
                        .category("TRACTOR")
                        .brand("Mahindra")
                        .horsepower(47)
                        .fuelType("DIESEL")
                        .hourlyRate(850.0)
                        .dailyRate(4200.0)
                        .securityDeposit(2000.0)
                        .operatorIncluded(true)
                        .conditionStatus("EXCELLENT")
                        .status("AVAILABLE")
                        .locationName("Mandya Agricultural Hub, Karnataka")
                        .latitude(12.5240)
                        .longitude(76.8980)
                        .ownerName("Ramesh Gowda")
                        .ownerPhone("+91 98450 12893")
                        .owner(defaultOwner)
                        .imageUrl("https://images.unsplash.com/photo-1594771804886-a933bb2d609b?w=800&auto=format&fit=crop&q=80")
                        .description("47 HP powerhouse with advanced hydraulic lift, 8 forward + 2 reverse gears, power steering, and low diesel consumption.")
                        .specsJson("{\"engine\":\"4-Cylinder Water Cooled\",\"hydraulics\":\"1600 kg capacity\",\"fuelTank\":\"48 Liters\",\"ptoHp\":\"42 HP\"}")
                        .rating(4.9)
                        .totalRentalsCount(28)
                        .createdAt(LocalDateTime.now().minusDays(45))
                        .build(),

                EquipmentEntity.builder()
                        .name("John Deere 5050D Utility Tractor")
                        .category("TRACTOR")
                        .brand("John Deere")
                        .horsepower(50)
                        .fuelType("DIESEL")
                        .hourlyRate(950.0)
                        .dailyRate(4800.0)
                        .securityDeposit(2500.0)
                        .operatorIncluded(true)
                        .conditionStatus("EXCELLENT")
                        .status("AVAILABLE")
                        .locationName("Mysore Rural Belt, Karnataka")
                        .latitude(12.3150)
                        .longitude(76.6620)
                        .ownerName("Chennappa Farmer FPO")
                        .ownerPhone("+91 94481 33490")
                        .owner(defaultOwner)
                        .imageUrl("https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80")
                        .description("Piston cooling jet technology with dual clutch, oil-immersed disc brakes, and high backup torque for heavy field operations.")
                        .specsJson("{\"transmission\":\"8F + 4R Collarshift\",\"steering\":\"Power Steering\",\"liftCapacity\":\"1600 kg\",\"ptoRpm\":\"540 @ 2100\"}")
                        .rating(4.8)
                        .totalRentalsCount(34)
                        .createdAt(LocalDateTime.now().minusDays(30))
                        .build(),

                EquipmentEntity.builder()
                        .name("Kubota DC-68G Combine Harvester")
                        .category("COMBINE_HARVESTER")
                        .brand("Kubota")
                        .horsepower(68)
                        .fuelType("DIESEL")
                        .hourlyRate(2400.0)
                        .dailyRate(15500.0)
                        .securityDeposit(5000.0)
                        .operatorIncluded(true)
                        .conditionStatus("EXCELLENT")
                        .status("AVAILABLE")
                        .locationName("Cauvery Delta CHC, Srirangapatna")
                        .latitude(12.4180)
                        .longitude(76.6950)
                        .ownerName("Cauvery Agri Hiring Center")
                        .ownerPhone("+91 98860 44102")
                        .owner(defaultOwner)
                        .imageUrl("https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&auto=format&fit=crop&q=80")
                        .description("High-speed rubber crawler paddy and wheat harvester with minimal grain loss (<1.5%), wide cutter bar, and 1250L grain tank.")
                        .specsJson("{\"cuttingWidth\":\"2.0 meters\",\"grainTank\":\"1250 Liters\",\"crawler\":\"Wide Rubber Track\",\"fuelEfficiency\":\"8 L/hr\"}")
                        .rating(4.9)
                        .totalRentalsCount(19)
                        .createdAt(LocalDateTime.now().minusDays(60))
                        .build(),

                EquipmentEntity.builder()
                        .name("DJI Agras T40 Ultra Smart Spraying Drone")
                        .category("DRONE_SPRAYER")
                        .brand("DJI Agriculture")
                        .horsepower(15) // Equivalent electric KW
                        .fuelType("ELECTRIC")
                        .hourlyRate(1400.0)
                        .dailyRate(7000.0)
                        .securityDeposit(3000.0)
                        .operatorIncluded(true)
                        .conditionStatus("EXCELLENT")
                        .status("AVAILABLE")
                        .locationName("Krishi Vigyan Kendra Center, Mandya")
                        .latitude(12.5310)
                        .longitude(76.9050)
                        .ownerName("SkyKrishi Drone Pilot Hub")
                        .ownerPhone("+91 97402 88194")
                        .owner(defaultOwner)
                        .imageUrl("https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80")
                        .description("DGCA Certified pilot provided. 40 kg spray payload, dual atomized centrifugal nozzles, omnidirectional phased array radar, covers 1 acre in 7 mins.")
                        .specsJson("{\"payload\":\"40 Liters\",\"sprayWidth\":\"11 meters\",\"battery\":\"30000 mAh Dual\",\"obstacleAvoidance\":\"Active Phased Radar\"}")
                        .rating(5.0)
                        .totalRentalsCount(42)
                        .createdAt(LocalDateTime.now().minusDays(15))
                        .build(),

                EquipmentEntity.builder()
                        .name("Shaktiman Semi-Champion 6ft Rotavator")
                        .category("ROTAVATOR")
                        .brand("Shaktiman")
                        .horsepower(45)
                        .fuelType("DIESEL")
                        .hourlyRate(600.0)
                        .dailyRate(3000.0)
                        .securityDeposit(1500.0)
                        .operatorIncluded(false)
                        .conditionStatus("GOOD")
                        .status("AVAILABLE")
                        .locationName("Maddur Taluk, Karnataka")
                        .latitude(12.5840)
                        .longitude(77.0420)
                        .ownerName("Basavaraju S.")
                        .ownerPhone("+91 96112 55901")
                        .owner(defaultOwner)
                        .imageUrl("https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=80")
                        .description("Heavy-duty multi-speed gearbox with Boron steel L-type blades. Delivers optimal soil tilth and weed eradication in single pass.")
                        .specsJson("{\"workingWidth\":\"180 cm\",\"blades\":\"48 Boron Steel\",\"gearbox\":\"Multi-Speed 540/1000 RPM\",\"weight\":\"440 kg\"}")
                        .rating(4.7)
                        .totalRentalsCount(16)
                        .createdAt(LocalDateTime.now().minusDays(20))
                        .build(),

                EquipmentEntity.builder()
                        .name("Trimble AgGPS FieldLevel II Laser Land Leveler")
                        .category("LASER_LEVELER")
                        .brand("Trimble")
                        .horsepower(55)
                        .fuelType("DIESEL")
                        .hourlyRate(1350.0)
                        .dailyRate(8200.0)
                        .securityDeposit(3000.0)
                        .operatorIncluded(true)
                        .conditionStatus("EXCELLENT")
                        .status("AVAILABLE")
                        .locationName("Hassan Farm Mechanization Center")
                        .latitude(13.0070)
                        .longitude(76.1000)
                        .ownerName("PrecisionAg Solutions")
                        .ownerPhone("+91 99014 66205")
                        .owner(defaultOwner)
                        .imageUrl("https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80")
                        .description("High-precision dual slope laser transmitter and hydraulic drag scraper. Reduces irrigation water requirement by 35% and improves uniformity.")
                        .specsJson("{\"workingRange\":\"800 meters\",\"accuracy\":\"±1.5 mm per 30m\",\"bladeWidth\":\"2.1 meters\",\"controlSystem\":\"Hydraulic Proportional\"}")
                        .rating(4.8)
                        .totalRentalsCount(21)
                        .createdAt(LocalDateTime.now().minusDays(35))
                        .build(),

                EquipmentEntity.builder()
                        .name("Kirloskar 10 HP Hybrid Solar Water Pump")
                        .category("WATER_PUMP")
                        .brand("Kirloskar")
                        .horsepower(10)
                        .fuelType("SOLAR")
                        .hourlyRate(350.0)
                        .dailyRate(1800.0)
                        .securityDeposit(1000.0)
                        .operatorIncluded(false)
                        .conditionStatus("EXCELLENT")
                        .status("AVAILABLE")
                        .locationName("Pandavapura Canal Belt, Karnataka")
                        .latitude(12.5010)
                        .longitude(76.6710)
                        .ownerName("Nanjegowda")
                        .ownerPhone("+91 94801 77312")
                        .owner(defaultOwner)
                        .imageUrl("https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=800&auto=format&fit=crop&q=80")
                        .description("Portable trailer-mounted solar pumping system with backup diesel generator. 40,000 LPH discharge capacity.")
                        .specsJson("{\"head\":\"30-50 meters\",\"discharge\":\"40,000 LPH\",\"solarArray\":\"7.5 kW Foldable\",\"coupling\":\"Monoblock Quick Disconnect\"}")
                        .rating(4.7)
                        .totalRentalsCount(14)
                        .createdAt(LocalDateTime.now().minusDays(18))
                        .build(),

                EquipmentEntity.builder()
                        .name("New Holland Roll-Belt 450 Round Baler")
                        .category("BALER")
                        .brand("New Holland")
                        .horsepower(60)
                        .fuelType("DIESEL")
                        .hourlyRate(1750.0)
                        .dailyRate(10500.0)
                        .securityDeposit(4000.0)
                        .operatorIncluded(true)
                        .conditionStatus("EXCELLENT")
                        .status("AVAILABLE")
                        .locationName("Malavalli Sugar Belt, Karnataka")
                        .latitude(12.3850)
                        .longitude(77.0580)
                        .ownerName("GreenField Residue Management")
                        .ownerPhone("+91 97311 99044")
                        .owner(defaultOwner)
                        .imageUrl("https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80")
                        .description("Transforms paddy straw and sugarcane trash into high-density commercial fodder bales, eliminating stubble burning.")
                        .specsJson("{\"baleSize\":\"4x5 feet\",\"baleWeight\":\"280-350 kg\",\"capacity\":\"40-50 bales/hr\",\"twineWrapping\":\"Automatic Dual\"}")
                        .rating(4.9)
                        .totalRentalsCount(18)
                        .createdAt(LocalDateTime.now().minusDays(25))
                        .build()
        );

        equipmentRepository.saveAll(catalog);

        // Pre-seed 2 bookings so the UI has instant historical and active data
        if (bookingRepository.count() == 0 && !catalog.isEmpty()) {
            EquipmentEntity tractor = catalog.get(0);
            EquipmentEntity drone = catalog.get(3);
            String defaultRenterName = defaultOwner != null ? defaultOwner.getFullName() : "Thomas Shelby";
            String defaultRenterPhone = defaultOwner != null && defaultOwner.getPhoneNumber() != null ? defaultOwner.getPhoneNumber() : "+91 98451 00122";

            List<EquipmentBookingEntity> initialBookings = List.of(
                    EquipmentBookingEntity.builder()
                            .bookingReference("EQB-2026-4102")
                            .equipment(tractor)
                            .renter(defaultOwner)
                            .renterName(defaultRenterName)
                            .renterPhone(defaultRenterPhone)
                            .deliveryAddress("Plot 4, Kaveri Green Acres, Mandya")
                            .startDate(LocalDate.now().plusDays(2))
                            .endDate(LocalDate.now().plusDays(4))
                            .durationUnits(3)
                            .rentalType("DAILY")
                            .totalRentalAmount(12600.0)
                            .securityDeposit(2000.0)
                            .status("APPROVED")
                            .withOperator(true)
                            .deliveryRequired(true)
                            .specialInstructions("Deep plowing required for upcoming Kharif sugarcane crop.")
                            .bookedAt(LocalDateTime.now().minusHours(8))
                            .reviewedAt(LocalDateTime.now().minusHours(2))
                            .ownerNotes("Confirmed. Driver Manjunath assigned with full diesel tank.")
                            .build(),

                    EquipmentBookingEntity.builder()
                            .bookingReference("EQB-2026-7824")
                            .equipment(drone)
                            .renter(defaultOwner)
                            .renterName("Suresh Kumar")
                            .renterPhone("+91 91234 56789")
                            .deliveryAddress("Survey No 82, Maddur Road, Mandya")
                            .startDate(LocalDate.now().plusDays(5))
                            .endDate(LocalDate.now().plusDays(5))
                            .durationUnits(4)
                            .rentalType("HOURLY")
                            .totalRentalAmount(5600.0)
                            .securityDeposit(3000.0)
                            .status("PENDING_APPROVAL")
                            .withOperator(true)
                            .deliveryRequired(true)
                            .specialInstructions("Liquid bio-fungicide micro-spray over 4.5 acres of tomato.")
                            .bookedAt(LocalDateTime.now().minusHours(1))
                            .build()
            );

            bookingRepository.saveAll(initialBookings);
        }

        log.info("Farm Equipment Catalog seeded successfully with 8 premium machinery items and 2 bookings.");
    }

    @Transactional
    public List<EquipmentDTO.EquipmentItemDto> getAllEquipment(
            String category,
            Double userLat,
            Double userLng,
            Double maxDistanceKm,
            String search,
            String location
    ) {
        // First, ensure all legacy database images are sanitized
        fixOutdatedCatalogImages();

        boolean isBirmingham = (location != null && location.toLowerCase().contains("birmingham"))
                || (userLat != null && userLat > 50.0 && userLat < 55.0 && userLng != null && userLng > -4.0 && userLng < 0.0);

        double originLat;
        double originLng;
        if (userLat != null && userLng != null) {
            originLat = userLat;
            originLng = userLng;
        } else if (isBirmingham) {
            originLat = 52.4862;
            originLng = -1.8904;
        } else {
            originLat = DEFAULT_LAT;
            originLng = DEFAULT_LNG;
        }

        List<EquipmentEntity> list = equipmentRepository.findAll();

        return list.stream()
                .filter(eq -> {
                    if (category != null && !category.equalsIgnoreCase("ALL") && !eq.getCategory().equalsIgnoreCase(category)) {
                        return false;
                    }
                    if (search != null && !search.trim().isEmpty()) {
                        String q = search.toLowerCase().trim();
                        boolean matchName = eq.getName().toLowerCase().contains(q);
                        boolean matchBrand = eq.getBrand().toLowerCase().contains(q);
                        boolean matchLoc = eq.getLocationName().toLowerCase().contains(q);
                        if (!matchName && !matchBrand && !matchLoc) {
                            return false;
                        }
                    }
                    return true;
                })
                .map(eq -> {
                    EquipmentEntity mappedEq = isBirmingham ? mapToBirminghamRegionalHub(eq) : eq;
                    double dist = calculateHaversineKm(
                            originLat, originLng,
                            mappedEq.getLatitude() != null ? mappedEq.getLatitude() : originLat,
                            mappedEq.getLongitude() != null ? mappedEq.getLongitude() : originLng
                    );
                    return toItemDto(mappedEq, dist);
                })
                .filter(dto -> maxDistanceKm == null || dto.getDistanceKm() <= maxDistanceKm)
                .sorted((a, b) -> Double.compare(a.getDistanceKm(), b.getDistanceKm()))
                .collect(Collectors.toList());
    }

    // Overload for backwards compatibility
    @Transactional(readOnly = true)
    public List<EquipmentDTO.EquipmentItemDto> getAllEquipment(
            String category,
            Double userLat,
            Double userLng,
            Double maxDistanceKm,
            String search
    ) {
        return getAllEquipment(category, userLat, userLng, maxDistanceKm, search, null);
    }

    @Transactional(readOnly = true)
    public EquipmentDTO.EquipmentItemDto getEquipmentById(Long id, Double userLat, Double userLng) {
        EquipmentEntity eq = equipmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Equipment not found with ID: " + id));

        boolean isBirmingham = userLat != null && userLat > 50.0 && userLat < 55.0;
        double originLat = userLat != null ? userLat : (isBirmingham ? 52.4862 : DEFAULT_LAT);
        double originLng = userLng != null ? userLng : (isBirmingham ? -1.8904 : DEFAULT_LNG);

        EquipmentEntity mappedEq = isBirmingham ? mapToBirminghamRegionalHub(eq) : eq;
        double dist = calculateHaversineKm(
                originLat, originLng,
                mappedEq.getLatitude() != null ? mappedEq.getLatitude() : originLat,
                mappedEq.getLongitude() != null ? mappedEq.getLongitude() : originLng
        );

        return toItemDto(mappedEq, dist);
    }

    private EquipmentEntity mapToBirminghamRegionalHub(EquipmentEntity eq) {
        String cat = eq.getCategory() != null ? eq.getCategory().toUpperCase() : "";
        String name = eq.getName() != null ? eq.getName() : "";

        String hubLocation;
        double hubLat;
        double hubLng;
        String hubOwner;
        String hubPhone;

        if (cat.contains("TRACTOR") && name.contains("John Deere")) {
            hubLocation = "Sutton Coldfield Machinery Depot, Birmingham";
            hubLat = 52.5704;
            hubLng = -1.8240;
            hubOwner = "Midlands Farm Machinery Hire";
            hubPhone = "+44 121 354 8821";
        } else if (cat.contains("TRACTOR")) {
            hubLocation = "Solihull Agricultural Depot, West Midlands";
            hubLat = 52.4128;
            hubLng = -1.7782;
            hubOwner = "West Midlands Machinery Co-op (CHC)";
            hubPhone = "+44 121 496 0192";
        } else if (cat.contains("HARVESTER")) {
            hubLocation = "Coleshill CHC Farm Machinery Hub, Warwickshire";
            hubLat = 52.4985;
            hubLng = -1.7062;
            hubOwner = "Warwickshire Grain & Harvest Contracting";
            hubPhone = "+44 1675 463 990";
        } else if (cat.contains("DRONE")) {
            hubLocation = "Warwickshire Precision Agri-Drone Hub, Kenilworth";
            hubLat = 52.3421;
            hubLng = -1.5833;
            hubOwner = "AeroCrop Precision Ag Services UK";
            hubPhone = "+44 1926 852 114";
        } else if (cat.contains("ROTAVATOR")) {
            hubLocation = "Dudley & Stourbridge Tractor Implements, West Midlands";
            hubLat = 52.5123;
            hubLng = -2.0811;
            hubOwner = "Black Country Farm Implement Depot";
            hubPhone = "+44 1384 241 550";
        } else if (cat.contains("LEVELER")) {
            hubLocation = "Tamworth Farm Mechanization Center, Staffordshire";
            hubLat = 52.6340;
            hubLng = -1.6959;
            hubOwner = "Staffordshire Field Precision Drainage Ltd";
            hubPhone = "+44 1827 709 332";
        } else if (cat.contains("PUMP")) {
            hubLocation = "Bromsgrove Farm Irrigation & Pump Station, Worcestershire";
            hubLat = 52.3353;
            hubLng = -2.0579;
            hubOwner = "Worcestershire Agricultural Irrigation Hub";
            hubPhone = "+44 1527 874 120";
        } else if (cat.contains("BALER")) {
            hubLocation = "Lichfield Straw & Forage Equipment Center, Staffordshire";
            hubLat = 52.6835;
            hubLng = -1.8262;
            hubOwner = "Mercia Straw & Forage Hire";
            hubPhone = "+44 1543 410 788";
        } else {
            hubLocation = "West Midlands Central Agricultural Depot, Birmingham";
            hubLat = 52.4862;
            hubLng = -1.8904;
            hubOwner = "Birmingham CHC Machinery Center";
            hubPhone = "+44 121 200 4000";
        }

        return EquipmentEntity.builder()
                .id(eq.getId())
                .name(eq.getName())
                .category(eq.getCategory())
                .brand(eq.getBrand())
                .horsepower(eq.getHorsepower())
                .fuelType(eq.getFuelType())
                .hourlyRate(eq.getHourlyRate())
                .dailyRate(eq.getDailyRate())
                .securityDeposit(eq.getSecurityDeposit())
                .operatorIncluded(eq.getOperatorIncluded())
                .conditionStatus(eq.getConditionStatus())
                .status(eq.getStatus())
                .locationName(hubLocation)
                .latitude(hubLat)
                .longitude(hubLng)
                .ownerName(hubOwner)
                .ownerPhone(hubPhone)
                .owner(eq.getOwner())
                .imageUrl(sanitizeImage(eq.getImageUrl(), eq.getCategory(), eq.getName()))
                .description(eq.getDescription())
                .specsJson(eq.getSpecsJson())
                .rating(eq.getRating())
                .totalRentalsCount(eq.getTotalRentalsCount())
                .createdAt(eq.getCreatedAt())
                .build();
    }

    @Transactional
    public EquipmentDTO.EquipmentItemDto createEquipment(EquipmentDTO.CreateEquipmentRequest req, User currentUser) {
        EquipmentEntity entity = EquipmentEntity.builder()
                .name(req.getName())
                .category(req.getCategory().toUpperCase())
                .brand(req.getBrand())
                .horsepower(req.getHorsepower() != null ? req.getHorsepower() : 45)
                .fuelType(req.getFuelType() != null ? req.getFuelType().toUpperCase() : "DIESEL")
                .hourlyRate(req.getHourlyRate() != null ? req.getHourlyRate() : 750.0)
                .dailyRate(req.getDailyRate() != null ? req.getDailyRate() : 3800.0)
                .securityDeposit(req.getSecurityDeposit() != null ? req.getSecurityDeposit() : 1500.0)
                .operatorIncluded(req.getOperatorIncluded() != null ? req.getOperatorIncluded() : true)
                .conditionStatus(req.getConditionStatus() != null ? req.getConditionStatus() : "EXCELLENT")
                .status("AVAILABLE")
                .locationName(req.getLocationName() != null ? req.getLocationName() : "Mandya, Karnataka")
                .latitude(req.getLatitude() != null ? req.getLatitude() : DEFAULT_LAT)
                .longitude(req.getLongitude() != null ? req.getLongitude() : DEFAULT_LNG)
                .ownerName(req.getOwnerName() != null ? req.getOwnerName() : (currentUser != null && currentUser.getFullName() != null ? currentUser.getFullName() : "Local Farmer"))
                .ownerPhone(req.getOwnerPhone() != null ? req.getOwnerPhone() : "+91 98450 00000")
                .owner(currentUser)
                .imageUrl(req.getImageUrl() != null && !req.getImageUrl().isEmpty()
                        ? req.getImageUrl()
                        : "https://images.unsplash.com/photo-1594771804886-a933bb2d609b?w=800&auto=format&fit=crop&q=80")
                .description(req.getDescription())
                .specsJson(req.getSpecsJson() != null ? req.getSpecsJson() : "{}")
                .rating(5.0)
                .totalRentalsCount(0)
                .createdAt(LocalDateTime.now())
                .build();

        EquipmentEntity saved = equipmentRepository.save(entity);
        return toItemDto(saved, 0.0);
    }

    @Transactional
    public EquipmentDTO.BookingDto bookEquipment(EquipmentDTO.BookingRequest req, User currentUser) {
        EquipmentEntity eq = equipmentRepository.findById(req.getEquipmentId())
                .orElseThrow(() -> new IllegalArgumentException("Equipment item not found: " + req.getEquipmentId()));

        int units = req.getDurationUnits() != null && req.getDurationUnits() > 0 ? req.getDurationUnits() : 1;
        boolean isHourly = "HOURLY".equalsIgnoreCase(req.getRentalType());

        double unitPrice = isHourly ? eq.getHourlyRate() : eq.getDailyRate();
        double totalRent = unitPrice * units;
        double deposit = eq.getSecurityDeposit();

        String ref = "EQB-" + LocalDate.now().getYear() + "-" + (1000 + new Random().nextInt(9000));

        EquipmentBookingEntity booking = EquipmentBookingEntity.builder()
                .bookingReference(ref)
                .equipment(eq)
                .renter(currentUser)
                .renterName(req.getRenterName() != null ? req.getRenterName() : (currentUser != null && currentUser.getFullName() != null ? currentUser.getFullName() : "Farmer"))
                .renterPhone(req.getRenterPhone() != null ? req.getRenterPhone() : "+91 98000 00000")
                .deliveryAddress(req.getDeliveryAddress() != null ? req.getDeliveryAddress() : eq.getLocationName())
                .startDate(req.getStartDate() != null ? req.getStartDate() : LocalDate.now().plusDays(1))
                .endDate(req.getEndDate() != null ? req.getEndDate() : LocalDate.now().plusDays(units))
                .durationUnits(units)
                .rentalType(isHourly ? "HOURLY" : "DAILY")
                .totalRentalAmount(totalRent)
                .securityDeposit(deposit)
                .status("PENDING_APPROVAL")
                .withOperator(req.getWithOperator() != null ? req.getWithOperator() : eq.getOperatorIncluded())
                .deliveryRequired(req.getDeliveryRequired() != null ? req.getDeliveryRequired() : false)
                .specialInstructions(req.getSpecialInstructions())
                .bookedAt(LocalDateTime.now())
                .build();

        EquipmentBookingEntity saved = bookingRepository.save(booking);

        // Update equipment rental count
        eq.setTotalRentalsCount(eq.getTotalRentalsCount() + 1);
        equipmentRepository.save(eq);

        return toBookingDto(saved);
    }

    @Transactional(readOnly = true)
    public List<EquipmentDTO.BookingDto> getMyBookings(User currentUser) {
        if (currentUser == null) {
            return bookingRepository.findAll().stream().map(this::toBookingDto).collect(Collectors.toList());
        }
        List<EquipmentBookingEntity> list = bookingRepository.findByRenterIdOrderByBookedAtDesc(currentUser.getId());
        if (list.isEmpty()) {
            // Return all demo bookings so UI displays rich active items
            return bookingRepository.findAll().stream().map(this::toBookingDto).collect(Collectors.toList());
        }
        return list.stream().map(this::toBookingDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EquipmentDTO.BookingDto> getOwnerBookings(User currentUser) {
        if (currentUser == null) {
            return bookingRepository.findAll().stream().map(this::toBookingDto).collect(Collectors.toList());
        }
        List<EquipmentBookingEntity> list = bookingRepository.findByOwnerIdOrderByBookedAtDesc(currentUser.getId());
        if (list.isEmpty()) {
            return bookingRepository.findAll().stream().map(this::toBookingDto).collect(Collectors.toList());
        }
        return list.stream().map(this::toBookingDto).collect(Collectors.toList());
    }

    @Transactional
    public EquipmentDTO.BookingDto updateBookingStatus(Long bookingId, EquipmentDTO.UpdateBookingStatusRequest req, User currentUser) {
        EquipmentBookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with ID: " + bookingId));

        booking.setStatus(req.getStatus().toUpperCase());
        if (req.getNotes() != null) {
            booking.setOwnerNotes(req.getNotes());
        }
        booking.setReviewedAt(LocalDateTime.now());

        // If approved and currently ongoing, mark equipment status as RENTED
        if ("APPROVED".equalsIgnoreCase(req.getStatus())) {
            EquipmentEntity eq = booking.getEquipment();
            eq.setStatus("RENTED");
            equipmentRepository.save(eq);
        } else if ("COMPLETED".equalsIgnoreCase(req.getStatus()) || "REJECTED".equalsIgnoreCase(req.getStatus()) || "CANCELLED".equalsIgnoreCase(req.getStatus())) {
            EquipmentEntity eq = booking.getEquipment();
            eq.setStatus("AVAILABLE");
            equipmentRepository.save(eq);
        }

        EquipmentBookingEntity updated = bookingRepository.save(booking);
        return toBookingDto(updated);
    }

    // --- Helper Methods ---

    private double calculateHaversineKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c;
        return (double) Math.round(distance * 10.0) / 10.0; // 1 decimal place
    }

    private EquipmentDTO.EquipmentItemDto toItemDto(EquipmentEntity eq, double distanceKm) {
        String cleanImg = sanitizeImage(eq.getImageUrl(), eq.getCategory(), eq.getName());
        return EquipmentDTO.EquipmentItemDto.builder()
                .id(eq.getId())
                .name(eq.getName())
                .category(eq.getCategory())
                .brand(eq.getBrand())
                .horsepower(eq.getHorsepower())
                .fuelType(eq.getFuelType())
                .hourlyRate(eq.getHourlyRate())
                .dailyRate(eq.getDailyRate())
                .securityDeposit(eq.getSecurityDeposit())
                .operatorIncluded(eq.getOperatorIncluded())
                .conditionStatus(eq.getConditionStatus())
                .status(eq.getStatus())
                .locationName(eq.getLocationName())
                .latitude(eq.getLatitude())
                .longitude(eq.getLongitude())
                .distanceKm(distanceKm)
                .ownerName(eq.getOwnerName())
                .ownerPhone(eq.getOwnerPhone())
                .ownerId(eq.getOwner() != null ? eq.getOwner().getId() : null)
                .imageUrl(cleanImg)
                .description(eq.getDescription())
                .specsJson(eq.getSpecsJson())
                .rating(eq.getRating())
                .totalRentalsCount(eq.getTotalRentalsCount())
                .createdAt(eq.getCreatedAt())
                .build();
    }

    private EquipmentDTO.BookingDto toBookingDto(EquipmentBookingEntity b) {
        EquipmentEntity eq = b.getEquipment();
        String cleanImg = eq != null ? sanitizeImage(eq.getImageUrl(), eq.getCategory(), eq.getName()) : "";
        return EquipmentDTO.BookingDto.builder()
                .id(b.getId())
                .bookingReference(b.getBookingReference())
                .equipmentId(eq != null ? eq.getId() : null)
                .equipmentName(eq != null ? eq.getName() : "")
                .equipmentCategory(eq != null ? eq.getCategory() : "")
                .equipmentBrand(eq != null ? eq.getBrand() : "")
                .equipmentImageUrl(cleanImg)
                .equipmentLocation(eq != null ? eq.getLocationName() : "")
                .renterId(b.getRenter() != null ? b.getRenter().getId() : null)
                .renterName(b.getRenterName())
                .renterPhone(b.getRenterPhone())
                .deliveryAddress(b.getDeliveryAddress())
                .startDate(b.getStartDate())
                .endDate(b.getEndDate())
                .durationUnits(b.getDurationUnits())
                .rentalType(b.getRentalType())
                .totalRentalAmount(b.getTotalRentalAmount())
                .securityDeposit(b.getSecurityDeposit())
                .status(b.getStatus())
                .withOperator(b.getWithOperator())
                .deliveryRequired(b.getDeliveryRequired())
                .specialInstructions(b.getSpecialInstructions())
                .bookedAt(b.getBookedAt())
                .reviewedAt(b.getReviewedAt())
                .ownerNotes(b.getOwnerNotes())
                .ownerName(eq != null ? eq.getOwnerName() : "")
                .ownerPhone(eq != null ? eq.getOwnerPhone() : "")
                .build();
    }
}
