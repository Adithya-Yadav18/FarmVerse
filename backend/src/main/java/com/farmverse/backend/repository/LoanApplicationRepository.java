package com.farmverse.backend.repository;

import com.farmverse.backend.entity.LoanApplicationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanApplicationRepository extends JpaRepository<LoanApplicationEntity, Long> {

    Optional<LoanApplicationEntity> findByApplicationNumber(String applicationNumber);

    List<LoanApplicationEntity> findByFarmerIdOrderByAppliedAtDesc(Long farmerId);

    List<LoanApplicationEntity> findByFarmIdOrderByAppliedAtDesc(Long farmId);

    List<LoanApplicationEntity> findAllByOrderByAppliedAtDesc();

    List<LoanApplicationEntity> findByStatusOrderByAppliedAtDesc(String status);
}
