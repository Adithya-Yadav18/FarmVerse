package com.farmverse.backend.controller;

import com.farmverse.backend.dto.AdminDTO;
import com.farmverse.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<AdminDTO.AdminUserSummaryDto>> getAllUsers(
            @RequestParam(required = false, defaultValue = "ALL") String role,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "ALL") String status
    ) {
        return ResponseEntity.ok(adminService.getAllUsers(role, search, status));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AdminDTO.AdminUserSummaryDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<AdminDTO.AdminUserSummaryDto> updateUserRole(
            @PathVariable Long id,
            @RequestBody AdminDTO.UpdateUserRoleRequest request
    ) {
        return ResponseEntity.ok(adminService.updateUserRole(id, request));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<AdminDTO.AdminUserSummaryDto> updateUserStatus(
            @PathVariable Long id,
            @RequestBody AdminDTO.UpdateUserStatusRequest request
    ) {
        return ResponseEntity.ok(adminService.updateUserStatus(id, request));
    }

    @PostMapping("/users")
    public ResponseEntity<AdminDTO.AdminUserSummaryDto> createUser(
            @RequestBody AdminDTO.CreateUserByAdminRequest request
    ) {
        return ResponseEntity.ok(adminService.createUser(request));
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminDTO.PlatformStatsDto> getPlatformStats() {
        return ResponseEntity.ok(adminService.getPlatformStats());
    }
}
