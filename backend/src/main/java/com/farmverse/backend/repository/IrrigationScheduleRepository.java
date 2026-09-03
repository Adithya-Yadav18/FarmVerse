package com.farmverse.backend.repository;

import com.farmverse.backend.entity.IrrigationSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IrrigationScheduleRepository extends JpaRepository<IrrigationSchedule, Long> {

    @Query("SELECT s FROM IrrigationSchedule s WHERE s.farm.id = :farmId ORDER BY s.startTime DESC")
    List<IrrigationSchedule> findByFarmIdOrderByStartTimeDesc(@Param("farmId") Long farmId);

    @Query("SELECT s FROM IrrigationSchedule s WHERE s.farm.farmer.user.email = :email ORDER BY s.startTime DESC")
    List<IrrigationSchedule> findByFarmerEmailOrderByStartTimeDesc(@Param("email") String email);

    List<IrrigationSchedule> findByStatus(String status);
}
