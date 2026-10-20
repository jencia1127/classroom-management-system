package com.classroom.backend;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/my")
public class StudentPortalController {

    private final AppUserRepository userRepository;
    private final ProgressReportController progressReportController;

    public StudentPortalController(
            AppUserRepository userRepository,
            ProgressReportController progressReportController) {
        this.userRepository = userRepository;
        this.progressReportController = progressReportController;
    }

    @GetMapping("/progress")
    public ProgressReportController.ProgressReport getMyProgress(
            Authentication authentication) {

        AppUser account = userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Account not found"));

        if (!"STUDENT".equals(account.getRole())
                || account.getStudentId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "This account is not linked to a student");
        }

        return progressReportController.getReport(account.getStudentId());
    }
}