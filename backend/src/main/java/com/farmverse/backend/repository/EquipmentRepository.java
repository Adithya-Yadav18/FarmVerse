package com.farmverse.backend.repository;

import com.farmverse.backend.entity.EquipmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentRepository extends JpaRepository<EquipmentEntity, Long> {

    List<EquipmentEntity> findByStatus(String status);

    List<EquipmentEntity> findByCategory(String category);

    List<EquipmentEntity> findByOwnerId(Long ownerId);

    List<EquipmentEntity> findByCategoryAndStatus(String category, String status);
}
