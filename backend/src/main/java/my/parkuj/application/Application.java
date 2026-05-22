package my.parkuj.application;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "my.parkuj.application")
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
