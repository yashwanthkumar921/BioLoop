package com.bioloop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BioloopApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(BioloopApiApplication.class, args);
	}

}
