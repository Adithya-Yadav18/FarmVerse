package com.farmverse.backend.repository;

import com.farmverse.backend.entity.VoiceConsultationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoiceConsultationRepository extends JpaRepository<VoiceConsultationEntity, Long> {

    List<VoiceConsultationEntity> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<VoiceConsultationEntity> findByLanguageCodeOrderByCreatedAtDesc(String languageCode);
}
