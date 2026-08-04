package com.group108.printease;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
@EnableScheduling
public class PrintEaseApplication {
    public static void main(String[] args) {
        SpringApplication.run(PrintEaseApplication.class, args);
    }

    @Bean
    public CommandLineRunner dropOldEmailConstraint(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE users_tbl DROP CONSTRAINT IF EXISTS uk8usegh22yymqae5jjt4pdb3k CASCADE");
                jdbcTemplate.execute("DROP INDEX IF EXISTS uk8usegh22yymqae5jjt4pdb3k CASCADE");
                jdbcTemplate.execute("ALTER TABLE users_tbl DROP CONSTRAINT IF EXISTS users_tbl_email_key CASCADE");
                jdbcTemplate.execute("DROP INDEX IF EXISTS users_tbl_email_key CASCADE");
                jdbcTemplate.execute("UPDATE users_tbl SET is_verified = true WHERE is_verified = false OR is_verified IS NULL");
                jdbcTemplate.execute("DELETE FROM users_tbl WHERE user_id NOT IN (SELECT MIN(user_id) FROM users_tbl GROUP BY email, role)");
                jdbcTemplate.execute("ALTER TABLE users_tbl DROP CONSTRAINT IF EXISTS uk_email_role CASCADE");
                jdbcTemplate.execute("ALTER TABLE users_tbl ADD CONSTRAINT uk_email_role UNIQUE (email, role)");
            } catch (Exception e) {
                System.out.println("Notice: Could not execute database startup maintenance: " + e.getMessage());
            }
        };
    }
}
