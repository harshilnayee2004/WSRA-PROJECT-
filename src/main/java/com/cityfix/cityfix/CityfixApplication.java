package com.cityfix.cityfix;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {
        "com.cityfix.cityfix",
        "soap.config"
})
public class CityfixApplication {

    public static void main(String[] args) {
        SpringApplication.run(CityfixApplication.class, args);
    }
}