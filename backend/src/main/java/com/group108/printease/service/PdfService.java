package com.group108.printease.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.Set;
import java.util.TreeSet;

@Service
public class PdfService {

    /**
     * Slices a PDF file based on a custom page range string.
     * The original file is overwritten with the sliced version.
     * @param filePath Absolute path to the PDF file.
     * @param pageRangeStr Page range (e.g., "1-3, 5, 8-10" or "All").
     * @return The new total page count.
     */
    public int slicePdf(String filePath, String pageRangeStr) {
        if (pageRangeStr == null || pageRangeStr.trim().isEmpty() || pageRangeStr.equalsIgnoreCase("All")) {
            return -1; // No slicing needed
        }

        File file = new File(filePath);
        if (!file.exists()) {
            return -1;
        }

        try (PDDocument source = Loader.loadPDF(file);
             PDDocument destination = new PDDocument()) {

            int totalOriginalPages = source.getNumberOfPages();
            Set<Integer> pagesToExtract = parsePageRange(pageRangeStr, totalOriginalPages);

            // If parsed range includes all pages or failed to parse, don't slice
            if (pagesToExtract.size() == totalOriginalPages) {
                return totalOriginalPages;
            }

            // Extract requested pages (PDDocument uses 0-based indexing)
            for (Integer pageNum : pagesToExtract) {
                // pageNum is 1-based, getPage is 0-based
                destination.importPage(source.getPage(pageNum - 1));
            }

            // Overwrite original file
            destination.save(file);
            return destination.getNumberOfPages();

        } catch (Exception e) {
            System.err.println("Failed to slice PDF: " + e.getMessage());
            return -1;
        }
    }

    private Set<Integer> parsePageRange(String pageRangeStr, int totalPages) {
        Set<Integer> pages = new TreeSet<>();
        
        String[] parts = pageRangeStr.split(",");
        for (String part : parts) {
            part = part.trim();
            if (part.contains("-")) {
                String[] range = part.split("-");
                if (range.length == 2) {
                    try {
                        int start = Integer.parseInt(range[0].trim());
                        int end = Integer.parseInt(range[1].trim());
                        for (int i = start; i <= end; i++) {
                            if (i >= 1 && i <= totalPages) {
                                pages.add(i);
                            }
                        }
                    } catch (NumberFormatException e) {
                        // ignore invalid format
                    }
                }
            } else {
                try {
                    int page = Integer.parseInt(part);
                    if (page >= 1 && page <= totalPages) {
                        pages.add(page);
                    }
                } catch (NumberFormatException e) {
                    // ignore
                }
            }
        }

        // Fallback: If nothing was parsed successfully, include all pages
        if (pages.isEmpty()) {
            for (int i = 1; i <= totalPages; i++) {
                pages.add(i);
            }
        }

        return pages;
    }
}
