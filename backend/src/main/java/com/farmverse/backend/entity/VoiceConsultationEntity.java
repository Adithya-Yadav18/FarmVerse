package com.farmverse.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "voice_consultations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceConsultationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private Long farmId;

    @Column(nullable = false, length = 10)
    private String languageCode; // hi, kn, ta, te, mr, en

    @Column(columnDefinition = "TEXT", nullable = false)
    private String transcribedQuery; // What farmer spoke

    @Column(columnDefinition = "TEXT")
    private String translatedQueryEnglish;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String spokenResponse; // Short regional audio response for speech playback

    @Column(columnDefinition = "TEXT")
    private String writtenAdvisory; // Detailed formatted agronomic advisory with steps

    @Column(length = 50)
    private String category; // PEST_DISEASE, WEATHER, MANDI, FERTILIZER, GENERAL

    private Integer audioLengthSeconds;

    @Builder.Default
    private Boolean isBookmarked = false;

    private LocalDateTime createdAt;
}
