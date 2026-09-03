package com.farmverse.backend.repository;

import com.farmverse.backend.entity.IoTDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IoTDeviceRepository extends JpaRepository<IoTDevice, Long> {

    @Query("SELECT d FROM IoTDevice d WHERE d.farm.farmer.user.email = :email ORDER BY d.createdAt DESC")
    List<IoTDevice> findByFarmerEmail(@Param("email") String email);

    Optional<IoTDevice> findByDeviceId(String deviceId);

    List<IoTDevice> findByFarm_Id(Long farmId);
}
