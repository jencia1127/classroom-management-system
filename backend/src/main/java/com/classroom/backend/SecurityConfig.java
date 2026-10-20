package com.classroom.backend;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/csrf").permitAll()
                        .requestMatchers("/api/auth/me").authenticated()
                        .requestMatchers("/api/my/**").hasRole("STUDENT")
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/assignments",
                                "/api/schedules"
                        ).hasAnyRole("TEACHER", "STUDENT")
                        .requestMatchers("/api/**").hasRole("TEACHER")
                        .anyRequest().denyAll()
                )
                .formLogin(form -> form
                        .loginProcessingUrl("/api/auth/login")
                        .successHandler((request, response, authentication) ->
                                response.setStatus(204))
                        .failureHandler((request, response, exception) ->
                                response.setStatus(401))
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .logoutSuccessHandler(
                                (request, response, authentication) ->
                                        response.setStatus(204))
                        .permitAll()
                )
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint(
                                (request, response, exception) ->
                                        response.setStatus(401))
                        .accessDeniedHandler(
                                (request, response, exception) ->
                                        response.setStatus(403))
                )
                .requestCache(cache -> cache.disable());

        return http.build();
    }
}