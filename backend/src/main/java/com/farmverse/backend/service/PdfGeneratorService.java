package com.farmverse.backend.service;

import com.farmverse.backend.entity.*;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PdfGeneratorService {

    // FarmVerse Design Palette
    private static final Color EMERALD_PRIMARY = new Color(16, 120, 80);
    private static final Color EMERALD_DARK = new Color(10, 80, 52);
    private static final Color ACCENT_GOLD = new Color(217, 160, 30);
    private static final Color TEXT_DARK = new Color(30, 41, 59);
    private static final Color TEXT_MUTED = new Color(100, 116, 139);
    private static final Color BG_ROW_ALT = new Color(248, 250, 252);
    private static final Color BG_CARD = new Color(241, 245, 249);
    private static final Color BORDER_LIGHT = new Color(226, 232, 240);
    private static final Color BADGE_GREEN = new Color(22, 163, 74);
    private static final Color BADGE_RED = new Color(225, 29, 72);
    private static final Color BADGE_ORANGE = new Color(234, 88, 12);

    // Standardized Fonts
    private static final Font FONT_TITLE = new Font(Font.HELVETICA, 18, Font.BOLD, EMERALD_PRIMARY);
    private static final Font FONT_SUBTITLE = new Font(Font.HELVETICA, 10, Font.NORMAL, TEXT_MUTED);
    private static final Font FONT_SECTION_HEADER = new Font(Font.HELVETICA, 13, Font.BOLD, EMERALD_DARK);
    private static final Font FONT_BODY = new Font(Font.HELVETICA, 9, Font.NORMAL, TEXT_DARK);
    private static final Font FONT_BODY_BOLD = new Font(Font.HELVETICA, 9, Font.BOLD, TEXT_DARK);
    private static final Font FONT_TABLE_HEADER = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);
    private static final Font FONT_SMALL_MUTED = new Font(Font.HELVETICA, 8, Font.NORMAL, TEXT_MUTED);
    private static final Font FONT_KPI_VALUE = new Font(Font.HELVETICA, 14, Font.BOLD, EMERALD_PRIMARY);
    private static final Font FONT_KPI_LABEL = new Font(Font.HELVETICA, 8, Font.NORMAL, TEXT_MUTED);

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");

    public byte[] generateAgronomyReport(
            ReportEntity report,
            List<Farm> farms,
            List<Crop> crops,
            List<SoilData> soilRecords,
            List<DiseaseDetection> diseases,
            List<IrrigationSchedule> irrigations,
            String notes
    ) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 40, 40);

        try {
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            writer.setPageEvent(new HeaderFooterPageEvent());
            document.open();

            // 1. Document Banner & Header
            addHeader(document, report);

            // 2. Report Overview & Meta Card
            addOverviewCard(document, report, notes);

            // 3. KPI Summary Strip
            addKpiStrip(document, report.getReportType(), farms, crops, soilRecords, diseases, irrigations);

            // 4. Content Sections based on Report Type
            String type = report.getReportType();
            if ("AGRONOMY_COMPREHENSIVE".equalsIgnoreCase(type)) {
                addFarmsSection(document, farms);
                addCropsSection(document, crops);
                addSoilSection(document, soilRecords);
                addDiseasesSection(document, diseases);
                addIrrigationSection(document, irrigations);
            } else if ("SOIL_NUTRIENT".equalsIgnoreCase(type)) {
                addFarmsSection(document, farms);
                addSoilSection(document, soilRecords);
            } else if ("DISEASE_SURVEILLANCE".equalsIgnoreCase(type)) {
                addFarmsSection(document, farms);
                addDiseasesSection(document, diseases);
            } else if ("IRRIGATION_EFFICIENCY".equalsIgnoreCase(type)) {
                addFarmsSection(document, farms);
                addIrrigationSection(document, irrigations);
            } else { // CROP_CYCLE_SUMMARY or other
                addFarmsSection(document, farms);
                addCropsSection(document, crops);
                addDiseasesSection(document, diseases);
            }

            // 5. Agronomist Advisory & Sign-off Block
            addSignoffBlock(document, report);

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF agronomy report: " + e.getMessage(), e);
        }

        return baos.toByteArray();
    }

    private void addHeader(Document document, ReportEntity report) throws DocumentException {
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{70, 30});

        // Left: Branding & Titles
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.setPaddingBottom(8f);

        Paragraph logoTitle = new Paragraph("FARMVERSE PRECISION AGRONOMY", FONT_TITLE);
        Paragraph subtitle = new Paragraph("Intelligent Agricultural Management & Field Health Analytics", FONT_SUBTITLE);
        Paragraph reportName = new Paragraph(report.getReportTitle(), new Font(Font.HELVETICA, 12, Font.BOLD, TEXT_DARK));

        leftCell.addElement(logoTitle);
        leftCell.addElement(subtitle);
        leftCell.addElement(reportName);
        headerTable.addCell(leftCell);

        // Right: Metadata Box
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        rightCell.setPaddingBottom(8f);

        Paragraph meta = new Paragraph();
        meta.setAlignment(Element.ALIGN_RIGHT);
        meta.add(new Chunk("Report ID: #" + (report.getId() != null ? report.getId() : "NEW") + "\n", FONT_BODY_BOLD));
        meta.add(new Chunk("Generated: " + (report.getGeneratedAt() != null ? report.getGeneratedAt().format(DATE_FMT) : LocalDateTime.now().format(DATE_FMT)) + "\n", FONT_SMALL_MUTED));
        meta.add(new Chunk("Range: " + (report.getDateRange() != null ? report.getDateRange() : "Current Season") + "\n", FONT_SMALL_MUTED));
        meta.add(new Chunk("Classification: FIELD VERIFIED", new Font(Font.HELVETICA, 8, Font.BOLD, ACCENT_GOLD)));
        rightCell.addElement(meta);
        headerTable.addCell(rightCell);

        document.add(headerTable);

        // Thin emerald divider
        PdfPTable divider = new PdfPTable(1);
        divider.setWidthPercentage(100);
        PdfPCell divCell = new PdfPCell();
        divCell.setBackgroundColor(EMERALD_PRIMARY);
        divCell.setFixedHeight(2f);
        divCell.setBorder(Rectangle.NO_BORDER);
        divider.addCell(divCell);
        document.add(divider);

        document.add(new Paragraph(" ", new Font(Font.HELVETICA, 4)));
    }

    private void addOverviewCard(Document document, ReportEntity report, String notes) throws DocumentException {
        PdfPTable card = new PdfPTable(1);
        card.setWidthPercentage(100);
        card.setSpacingBefore(6f);
        card.setSpacingAfter(8f);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(BG_CARD);
        cell.setBorderColor(BORDER_LIGHT);
        cell.setPadding(10f);

        Paragraph title = new Paragraph("Executive Agronomy Assessment & Operational Context", FONT_BODY_BOLD);
        title.setSpacingAfter(4f);
        cell.addElement(title);

        String summary = report.getSummary() != null ? report.getSummary() :
                "This comprehensive field surveillance dossier integrates sensor telemetry, soil biochemistry analyses, phytosanitary diagnostic logs, and precision irrigation regimens to evaluate overall crop health, yield trajectory, and resource efficiency.";
        Paragraph summaryPara = new Paragraph(summary, FONT_BODY);
        cell.addElement(summaryPara);

        if (notes != null && !notes.isBlank()) {
            Paragraph notesHeading = new Paragraph("\nAgronomist Special Directive:", FONT_BODY_BOLD);
            Paragraph notesContent = new Paragraph(notes, new Font(Font.HELVETICA, 8.5f, Font.ITALIC, TEXT_DARK));
            cell.addElement(notesHeading);
            cell.addElement(notesContent);
        }

        card.addCell(cell);
        document.add(card);
    }

    private void addKpiStrip(
            Document document,
            String reportType,
            List<Farm> farms,
            List<Crop> crops,
            List<SoilData> soils,
            List<DiseaseDetection> diseases,
            List<IrrigationSchedule> irrigations
    ) throws DocumentException {
        PdfPTable kpiTable = new PdfPTable(4);
        kpiTable.setWidthPercentage(100);
        kpiTable.setSpacingAfter(10f);

        double totalAcres = farms.stream().mapToDouble(f -> f.getTotalAreaAcres() != null ? f.getTotalAreaAcres() : 0.0).sum();
        long activeDiseases = diseases.stream().filter(d -> "Active".equalsIgnoreCase(d.getStatus())).count();
        long completedIrrigations = irrigations.stream().filter(i -> "Completed".equalsIgnoreCase(i.getStatus())).count();
        double avgPh = soils.isEmpty() ? 0.0 : soils.stream().mapToDouble(s -> s.getPhLevel() != null ? s.getPhLevel() : 0.0).average().orElse(0.0);

        addKpiCell(kpiTable, "TOTAL ACREAGE", String.format("%.1f ac", totalAcres), farms.size() + " farm plots registered");
        addKpiCell(kpiTable, "ACTIVE PATHOGENS", String.valueOf(activeDiseases), activeDiseases > 0 ? "Requires mitigation" : "Optimal health status");
        addKpiCell(kpiTable, "SOIL PH AVERAGE", avgPh > 0 ? String.format("%.2f", avgPh) : "N/A", avgPh >= 6.0 && avgPh <= 7.5 ? "Optimal balance" : "Check nutrient amendments");
        addKpiCell(kpiTable, "IRRIGATION RUNS", String.valueOf(completedIrrigations), irrigations.size() + " total cycles queued");

        document.add(kpiTable);
    }

    private void addKpiCell(PdfPTable table, String label, String value, String sub) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(Color.WHITE);
        cell.setBorderColor(BORDER_LIGHT);
        cell.setPadding(6f);

        Paragraph pLabel = new Paragraph(label, FONT_KPI_LABEL);
        Paragraph pValue = new Paragraph(value, FONT_KPI_VALUE);
        Paragraph pSub = new Paragraph(sub, FONT_SMALL_MUTED);

        cell.addElement(pLabel);
        cell.addElement(pValue);
        cell.addElement(pSub);
        table.addCell(cell);
    }

    private void addFarmsSection(Document document, List<Farm> farms) throws DocumentException {
        addSectionHeader(document, "1. Farm & Terrain Inventory");

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{25, 25, 15, 20, 15});
        table.setSpacingAfter(8f);

        addTableHeader(table, new String[]{"Farm Name", "Location", "Area", "Soil Type", "Status"});

        if (farms.isEmpty()) {
            addEmptyRow(table, 5, "No farm plots recorded in this scope.");
        } else {
            boolean alt = false;
            for (Farm f : farms) {
                Color bg = alt ? BG_ROW_ALT : Color.WHITE;
                addTableCell(table, f.getFarmName(), bg, false);
                addTableCell(table, f.getLocation() != null ? f.getLocation() : "Unspecified", bg, false);
                addTableCell(table, (f.getTotalAreaAcres() != null ? f.getTotalAreaAcres() : 0.0) + " " + (f.getAreaUnit() != null ? f.getAreaUnit() : "ac"), bg, false);
                addTableCell(table, f.getSoilType() != null ? f.getSoilType() : "Loam", bg, false);
                addTableCell(table, f.getStatus() != null ? f.getStatus() : "Active", bg, true);
                alt = !alt;
            }
        }
        document.add(table);
    }

    private void addCropsSection(Document document, List<Crop> crops) throws DocumentException {
        addSectionHeader(document, "2. Crop Cultivation & Phenology");

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{25, 20, 20, 15, 20});
        table.setSpacingAfter(8f);

        addTableHeader(table, new String[]{"Crop & Variety", "Growth Stage", "Planting Date", "Area (Ac)", "Est. Harvest"});

        if (crops.isEmpty()) {
            addEmptyRow(table, 5, "No active crop plantings detected.");
        } else {
            boolean alt = false;
            for (Crop c : crops) {
                Color bg = alt ? BG_ROW_ALT : Color.WHITE;
                String name = c.getCropName() + (c.getVariety() != null ? " (" + c.getVariety() + ")" : "");
                addTableCell(table, name, bg, false);
                addTableCell(table, c.getStatus() != null ? c.getStatus() : "Cultivated", bg, false);
                addTableCell(table, c.getPlantingDate() != null ? c.getPlantingDate().toString() : "Recent", bg, false);
                addTableCell(table, c.getArea() != null ? String.valueOf(c.getArea()) : "1.0", bg, false);
                addTableCell(table, c.getExpectedHarvestDate() != null ? c.getExpectedHarvestDate().toString() : "TBD", bg, false);
                alt = !alt;
            }
        }
        document.add(table);
    }

    private void addSoilSection(Document document, List<SoilData> soils) throws DocumentException {
        addSectionHeader(document, "3. Soil Chemistry & Macronutrient Telemetry");

        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{18, 12, 14, 14, 14, 14, 14});
        table.setSpacingAfter(8f);

        addTableHeader(table, new String[]{"Date", "pH", "N (kg/ha)", "P (kg/ha)", "K (kg/ha)", "Moisture %", "Organic C %"});

        if (soils.isEmpty()) {
            addEmptyRow(table, 7, "No recent soil lab or IoT sensor tests recorded.");
        } else {
            boolean alt = false;
            int count = 0;
            for (SoilData s : soils) {
                if (++count > 10) break; // Limit to latest 10 samples
                Color bg = alt ? BG_ROW_ALT : Color.WHITE;
                String date = s.getRecordedAt() != null ? s.getRecordedAt().format(DateTimeFormatter.ofPattern("MMM dd, yy")) : "Recent";
                addTableCell(table, date, bg, false);
                addTableCell(table, s.getPhLevel() != null ? String.format("%.2f", s.getPhLevel()) : "N/A", bg, false);
                addTableCell(table, s.getNitrogen() != null ? String.format("%.1f", s.getNitrogen()) : "-", bg, false);
                addTableCell(table, s.getPhosphorus() != null ? String.format("%.1f", s.getPhosphorus()) : "-", bg, false);
                addTableCell(table, s.getPotassium() != null ? String.format("%.1f", s.getPotassium()) : "-", bg, false);
                addTableCell(table, s.getMoisture() != null ? String.format("%.1f%%", s.getMoisture()) : "-", bg, false);
                addTableCell(table, s.getOrganicCarbon() != null ? String.format("%.2f%%", s.getOrganicCarbon()) : "-", bg, false);
                alt = !alt;
            }
        }
        document.add(table);
    }

    private void addDiseasesSection(Document document, List<DiseaseDetection> diseases) throws DocumentException {
        addSectionHeader(document, "4. Crop Pathology & AI Disease Surveillance Log");

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{20, 25, 15, 12, 13, 15});
        table.setSpacingAfter(8f);

        addTableHeader(table, new String[]{"Detected At", "Diagnosed Disease", "Confidence", "Severity", "Status", "Prescription"});

        if (diseases.isEmpty()) {
            addEmptyRow(table, 6, "No phytopathological diseases reported. Crop canopy is healthy.");
        } else {
            boolean alt = false;
            int count = 0;
            for (DiseaseDetection d : diseases) {
                if (++count > 10) break;
                Color bg = alt ? BG_ROW_ALT : Color.WHITE;
                String date = d.getDetectedAt() != null ? d.getDetectedAt().format(DateTimeFormatter.ofPattern("MMM dd HH:mm")) : "Recent";
                String conf = d.getConfidence() != null ? String.format("%.1f%%", d.getConfidence()) : "N/A";
                String prescription = (d.getTreatment() != null && !d.getTreatment().isBlank()) ? "Prescribed" : "Pending";

                addTableCell(table, date, bg, false);
                addTableCell(table, d.getDiseaseName() != null ? d.getDiseaseName() : "Undiagnosed", bg, false);
                addTableCell(table, conf, bg, false);
                addTableCell(table, d.getSeverity() != null ? d.getSeverity() : "Moderate", bg, true);
                addTableCell(table, d.getStatus() != null ? d.getStatus() : "Active", bg, true);
                addTableCell(table, prescription, bg, false);
                alt = !alt;
            }
        }
        document.add(table);
    }

    private void addIrrigationSection(Document document, List<IrrigationSchedule> irrigations) throws DocumentException {
        addSectionHeader(document, "5. Water Management & Precision Irrigation Schedules");

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{25, 20, 20, 15, 20});
        table.setSpacingAfter(8f);

        addTableHeader(table, new String[]{"Scheduled Start", "Duration (Mins)", "Water Volume (L)", "Method", "Execution Status"});

        if (irrigations.isEmpty()) {
            addEmptyRow(table, 5, "No irrigation runs scheduled or executed.");
        } else {
            boolean alt = false;
            int count = 0;
            for (IrrigationSchedule i : irrigations) {
                if (++count > 10) break;
                Color bg = alt ? BG_ROW_ALT : Color.WHITE;
                String date = i.getStartTime() != null ? i.getStartTime().format(DateTimeFormatter.ofPattern("MMM dd HH:mm")) : "Pending";
                addTableCell(table, date, bg, false);
                addTableCell(table, (i.getDurationMinutes() != null ? i.getDurationMinutes() : 0) + " mins", bg, false);
                addTableCell(table, (i.getWaterVolumeLiters() != null ? String.format("%.0f L", i.getWaterVolumeLiters()) : "Auto"), bg, false);
                addTableCell(table, i.getMethod() != null ? i.getMethod() : "Drip", bg, false);
                addTableCell(table, i.getStatus() != null ? i.getStatus() : "Scheduled", bg, true);
                alt = !alt;
            }
        }
        document.add(table);
    }

    private void addSignoffBlock(Document document, ReportEntity report) throws DocumentException {
        PdfPTable signoff = new PdfPTable(2);
        signoff.setWidthPercentage(100);
        signoff.setSpacingBefore(12f);
        signoff.setWidths(new float[]{60, 40});

        PdfPCell left = new PdfPCell();
        left.setBorder(Rectangle.NO_BORDER);
        left.addElement(new Paragraph("System Certification & Integrity Guarantee", FONT_BODY_BOLD));
        Paragraph disclaimer = new Paragraph(
                "This report has been cryptographically generated by FarmVerse Agronomy Core v2.4. " +
                        "Sensor measurements and machine learning diagnoses are aggregated from authorized IoT nodes and multispectral camera feeds. " +
                        "Field verification by a licensed agronomist is recommended for critical phytosanitary applications.",
                FONT_SMALL_MUTED
        );
        disclaimer.setSpacingBefore(3f);
        left.addElement(disclaimer);
        signoff.addCell(left);

        PdfPCell right = new PdfPCell();
        right.setBorder(Rectangle.NO_BORDER);
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);

        Paragraph sig = new Paragraph();
        sig.setAlignment(Element.ALIGN_RIGHT);
        sig.add(new Chunk("AGRONOMIST APPROVAL\n", FONT_BODY_BOLD));
        sig.add(new Chunk("FarmVerse Certified Advisory Board\n", FONT_BODY));
        sig.add(new Chunk("Verified: " + (report.getGeneratedByName() != null ? report.getGeneratedByName() : "Advisory Staff") + "\n", FONT_SMALL_MUTED));
        sig.add(new Chunk("Status: OFFICIAL RELEASE", new Font(Font.HELVETICA, 8, Font.BOLD, BADGE_GREEN)));

        right.addElement(sig);
        signoff.addCell(right);

        document.add(signoff);
    }

    private void addSectionHeader(Document document, String title) throws DocumentException {
        Paragraph p = new Paragraph(title, FONT_SECTION_HEADER);
        p.setSpacingBefore(8f);
        p.setSpacingAfter(4f);
        document.add(p);
    }

    private void addTableHeader(PdfPTable table, String[] headers) {
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, FONT_TABLE_HEADER));
            cell.setBackgroundColor(EMERALD_PRIMARY);
            cell.setPadding(5f);
            cell.setHorizontalAlignment(Element.ALIGN_LEFT);
            cell.setBorderColor(BORDER_LIGHT);
            table.addCell(cell);
        }
    }

    private void addTableCell(PdfPTable table, String text, Color bg, boolean isBadge) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(bg);
        cell.setBorderColor(BORDER_LIGHT);
        cell.setPadding(4.5f);

        if (isBadge) {
            Font font = FONT_BODY_BOLD;
            if ("Active".equalsIgnoreCase(text) || "High".equalsIgnoreCase(text) || "Critical".equalsIgnoreCase(text)) {
                font = new Font(Font.HELVETICA, 8, Font.BOLD, BADGE_RED);
            } else if ("Completed".equalsIgnoreCase(text) || "Low".equalsIgnoreCase(text) || "Resolved".equalsIgnoreCase(text)) {
                font = new Font(Font.HELVETICA, 8, Font.BOLD, BADGE_GREEN);
            } else if ("Moderate".equalsIgnoreCase(text) || "Pending".equalsIgnoreCase(text) || "Scheduled".equalsIgnoreCase(text)) {
                font = new Font(Font.HELVETICA, 8, Font.BOLD, BADGE_ORANGE);
            }
            cell.addElement(new Paragraph(text, font));
        } else {
            cell.addElement(new Paragraph(text != null ? text : "-", FONT_BODY));
        }

        table.addCell(cell);
    }

    private void addEmptyRow(PdfPTable table, int colspan, String message) {
        PdfPCell cell = new PdfPCell(new Phrase(message, FONT_SMALL_MUTED));
        cell.setColspan(colspan);
        cell.setPadding(8f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setBackgroundColor(Color.WHITE);
        cell.setBorderColor(BORDER_LIGHT);
        table.addCell(cell);
    }

    // Custom Page Event for Running Footer with Page Numbers
    private static class HeaderFooterPageEvent extends PdfPageEventHelper {
        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfPTable footer = new PdfPTable(2);
            try {
                footer.setWidths(new float[]{70, 30});
                footer.setTotalWidth(document.right() - document.left());

                PdfPCell leftCell = new PdfPCell(new Phrase("FarmVerse Agronomy Core • Confidential Field Report", FONT_SMALL_MUTED));
                leftCell.setBorder(Rectangle.TOP);
                leftCell.setBorderColor(BORDER_LIGHT);
                leftCell.setPaddingTop(4f);
                footer.addCell(leftCell);

                PdfPCell rightCell = new PdfPCell(new Phrase(String.format("Page %d", writer.getPageNumber()), FONT_SMALL_MUTED));
                rightCell.setBorder(Rectangle.TOP);
                rightCell.setBorderColor(BORDER_LIGHT);
                rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                rightCell.setPaddingTop(4f);
                footer.addCell(rightCell);

                footer.writeSelectedRows(0, -1, document.left(), document.bottom() - 10, writer.getDirectContent());
            } catch (Exception ignored) {
            }
        }
    }
}
