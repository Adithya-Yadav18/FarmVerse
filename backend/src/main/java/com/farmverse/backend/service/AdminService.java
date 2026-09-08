package com.farmverse.backend.service;

import com.farmverse.backend.dto.AdminDTO;
import com.farmverse.backend.entity.Farm;
import com.farmverse.backend.entity.User;
import com.farmverse.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final FarmRepository farmRepository;
    private final CropRepository cropRepository;
    private final EquipmentRepository equipmentRepository;
    private final CropRescueRepository rescueRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<AdminDTO.AdminUserSummaryDto> getAllUsers(String role, String search, String status) {
        List<User> all = userRepository.findAll();

        return all.stream()
                .filter(u -> {
                    if (role != null && !role.equalsIgnoreCase("ALL")) {
                        String cleanRole = u.getRole() != null ? u.getRole().replace("ROLE_", "").toUpperCase() : "";
                        String targetRole = role.replace("ROLE_", "").toUpperCase();
                        if (!cleanRole.equalsIgnoreCase(targetRole)) {
                            return false;
                        }
                    }
                    if (status != null && !status.equalsIgnoreCase("ALL")) {
                        String userStatus = u.getStatus() != null ? u.getStatus() : "ACTIVE";
                        if (!userStatus.equalsIgnoreCase(status)) {
                            return false;
                        }
                    }
                    if (search != null && !search.trim().isEmpty()) {
                        String q = search.toLowerCase().trim();
                        boolean matchName = u.getFullName() != null && u.getFullName().toLowerCase().contains(q);
                        boolean matchEmail = u.getEmail() != null && u.getEmail().toLowerCase().contains(q);
                        boolean matchPhone = u.getPhoneNumber() != null && u.getPhoneNumber().toLowerCase().contains(q);
                        boolean matchLoc = u.getLocation() != null && u.getLocation().toLowerCase().contains(q);
                        if (!matchName && !matchEmail && !matchPhone && !matchLoc) {
                            return false;
                        }
                    }
                    return true;
                })
                .map(this::toSummaryDto)
                .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminDTO.AdminUserSummaryDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));
        return toSummaryDto(user);
    }

    @Transactional
    public AdminDTO.AdminUserSummaryDto updateUserRole(Long id, AdminDTO.UpdateUserRoleRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));

        String rawRole = req.getRole().toUpperCase().trim();
        String roleWithPrefix = rawRole.startsWith("ROLE_") ? rawRole : "ROLE_" + rawRole;
        user.setRole(roleWithPrefix);

        User saved = userRepository.save(user);
        log.info("Admin updated role for user {} to {}", user.getEmail(), roleWithPrefix);
        return toSummaryDto(saved);
    }

    @Transactional
    public AdminDTO.AdminUserSummaryDto updateUserStatus(Long id, AdminDTO.UpdateUserStatusRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));

        String status = req.getStatus().toUpperCase().trim();
        user.setStatus(status);

        User saved = userRepository.save(user);
        log.info("Admin updated status for user {} to {}", user.getEmail(), status);
        return toSummaryDto(saved);
    }

    @Transactional
    public AdminDTO.AdminUserSummaryDto createUser(AdminDTO.CreateUserByAdminRequest req) {
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new IllegalArgumentException("User already exists with email: " + req.getEmail());
        }

        String rawRole = req.getRole() != null ? req.getRole().toUpperCase().trim() : "FARMER";
        String roleWithPrefix = rawRole.startsWith("ROLE_") ? rawRole : "ROLE_" + rawRole;

        User user = new User();
        user.setFullName(req.getFullName());
        user.setEmail(req.getEmail().toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(req.getPassword() != null ? req.getPassword() : "FarmVerse@2026"));
        user.setRole(roleWithPrefix);
        user.setPhoneNumber(req.getPhoneNumber() != null ? req.getPhoneNumber() : "+91 98000 00000");
        user.setLocation(req.getLocation() != null ? req.getLocation() : "Karnataka, India");
        user.setStatus(req.getStatus() != null ? req.getStatus().toUpperCase() : "ACTIVE");
        user.setCreatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        log.info("Admin created new user {} with role {}", saved.getEmail(), roleWithPrefix);
        return toSummaryDto(saved);
    }

    @Transactional(readOnly = true)
    public AdminDTO.PlatformStatsDto getPlatformStats() {
        List<User> users = userRepository.findAll();
        List<Farm> farms = farmRepository.findAll();

        long totalUsers = users.size();
        long farmers = users.stream().filter(u -> u.getRole() != null && u.getRole().contains("FARMER")).count();
        long agronomists = users.stream().filter(u -> u.getRole() != null && u.getRole().contains("AGRONOMIST")).count();
        long admins = users.stream().filter(u -> u.getRole() != null && u.getRole().contains("ADMIN")).count();
        long normalUsers = users.stream().filter(u -> u.getRole() != null && (u.getRole().contains("USER") && !u.getRole().contains("ADMIN"))).count();

        long totalFarms = farms.size();
        double totalAcreage = farms.stream().mapToDouble(f -> f.getTotalAreaAcres() != null ? f.getTotalAreaAcres() : 0.0).sum();
        totalAcreage = (double) Math.round(totalAcreage * 10.0) / 10.0;

        long totalCrops = cropRepository.count();
        long totalEquipment = equipmentRepository.count();
        long activeRescues = rescueRepository.findAll().stream()
                .filter(r -> "SOS_TRIGGERED".equalsIgnoreCase(r.getStatus()) || "ANTIDOTE_DEPLOYED".equalsIgnoreCase(r.getStatus()))
                .count();

        Map<String, Long> roleDistribution = new HashMap<>();
        roleDistribution.put("Farmers", farmers);
        roleDistribution.put("Agronomists", agronomists);
        roleDistribution.put("Admins", admins);
        roleDistribution.put("Consumers / Normal Users", normalUsers);

        return AdminDTO.PlatformStatsDto.builder()
                .totalUsers(totalUsers)
                .totalFarmers(farmers)
                .totalAgronomists(agronomists)
                .totalAdmins(admins)
                .totalNormalUsers(normalUsers)
                .totalFarms(totalFarms)
                .totalAcreage(totalAcreage)
                .totalCropsPlanted(totalCrops)
                .totalEquipmentListings(totalEquipment)
                .totalActiveRescues(activeRescues)
                .totalCarbonCreditsTraded(142L)
                .roleDistribution(roleDistribution)
                .build();
    }

    private AdminDTO.AdminUserSummaryDto toSummaryDto(User u) {
        String cleanRole = u.getRole() != null ? u.getRole().replace("ROLE_", "") : "USER";
        String normalized = cleanRole.equalsIgnoreCase("FARMER") ? "Farmer"
                : cleanRole.equalsIgnoreCase("AGRONOMIST") ? "Agronomist"
                : cleanRole.equalsIgnoreCase("ADMIN") ? "Admin"
                : "Normal User";

        int farmCount = 0;
        int cropCount = 0;

        try {
            // Count farms owned by user
            farmCount = farmRepository.findByFarmerId(u.getId()).size();
        } catch (Exception ignored) {}

        return AdminDTO.AdminUserSummaryDto.builder()
                .id(u.getId())
                .fullName(u.getFullName() != null ? u.getFullName() : "User #" + u.getId())
                .email(u.getEmail())
                .role(u.getRole())
                .normalizedRole(normalized)
                .phoneNumber(u.getPhoneNumber() != null ? u.getPhoneNumber() : "—")
                .location(u.getLocation() != null ? u.getLocation() : "—")
                .status(u.getStatus() != null ? u.getStatus() : "ACTIVE")
                .totalFarmsCount(farmCount)
                .totalCropsCount(cropCount)
                .createdAt(u.getCreatedAt() != null ? u.getCreatedAt() : LocalDateTime.now().minusDays(30))
                .build();
    }
}
