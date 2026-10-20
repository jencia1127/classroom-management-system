package com.classroom.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("demo")
public class DemoAccountConfig {

    @Bean
    public CommandLineRunner createDemoAccounts(
            AppUserRepository userRepository,
            StudentRepository studentRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            if (!userRepository.existsByUsername("teacher")) {
                AppUser teacher = new AppUser();
                teacher.setUsername("teacher");
                teacher.setPasswordHash(
                        passwordEncoder.encode("TeacherDemo@123"));
                teacher.setRole("TEACHER");
                userRepository.save(teacher);
            }

            if (studentRepository.existsById(2L)
                    && !userRepository.existsByUsername("student")) {
                AppUser student = new AppUser();
                student.setUsername("student");
                student.setPasswordHash(
                        passwordEncoder.encode("StudentDemo@123"));
                student.setRole("STUDENT");
                student.setStudentId(2L);
                userRepository.save(student);
            }
        };
    }
}