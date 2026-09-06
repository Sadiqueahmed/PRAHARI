package com.prahari.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Async configuration using Java 21 virtual threads.
 * 
 * Virtual threads are ideal for the Alert Engine's fan-out pattern:
 * when a new hazard zone is created, the system may need to send
 * thousands of WhatsApp/SMS messages concurrently. Virtual threads
 * handle this without the overhead of platform thread pools.
 * 
 * Used by: {@code AlertOrchestrator} with {@code @Async("alertExecutor")}
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Task executor for alert broadcasting.
     * Uses a generous pool since virtual threads are lightweight.
     */
    @Bean(name = "alertExecutor")
    public Executor alertExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(100);
        executor.setQueueCapacity(5000);
        executor.setThreadNamePrefix("prahari-alert-");
        executor.setVirtualThreads(true);  // Java 21 virtual threads
        executor.initialize();
        return executor;
    }
}
