package com.classroom.backend;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AppUserRepository userRepository;

    public AuthController(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/csrf")
    public CsrfResponse getCsrfToken(CsrfToken csrfToken) {
        return new CsrfResponse(
                csrfToken.getHeaderName(),
                csrfToken.getToken());
    }

    @GetMapping("/me")
    public AccountResponse getCurrentAccount(Authentication authentication) {
        AppUser account = userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Account not found"));

        return new AccountResponse(
                account.getUsername(),
                account.getRole(),
                account.getStudentId());
    }

    public record CsrfResponse(String headerName, String token) {
    }

    public record AccountResponse(
            String username,
            String role,
            Long studentId) {
    }
}