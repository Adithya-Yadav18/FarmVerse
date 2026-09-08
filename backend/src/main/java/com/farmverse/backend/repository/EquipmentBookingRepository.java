package com.farmverse.backend.repository;

import com.farmverse.backend.entity.EquipmentBookingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentBookingRepository extends JpaRepository<EquipmentBookingEntity, Long> {

    List<EquipmentBookingEntity> findByRenterIdOrderByBookedAtDesc(Long renterId);

    @Query("SELECT b FROM EquipmentBookingEntity b WHERE b.equipment.owner.id = :ownerId ORDER BY b.bookedAt DESC")
    List<EquipmentBookingEntity> findByOwnerIdOrderByBookedAtDesc(@Param("ownerId") Long ownerId);

    Optional<EquipmentBookingEntity> findByBookingReference(String bookingReference);

    List<EquipmentBookingEntity> findByEquipmentId(Long equipmentId);
}
