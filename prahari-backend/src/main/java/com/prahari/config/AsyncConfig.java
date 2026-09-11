package com.prahari.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.scheduling.annotation.EnableAsync;

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
     * Uses SimpleAsyncTaskExecutor with virtual threads enabled (Java 21+).
     * Each task runs on its own virtual thread — lightweight and scalable.
     */
    @Bean(name = "alertExecutor")
    public Executor alertExecutor() {
        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("prahari-alert-");
        executor.setVirtualThreads(true);  // Java 21 virtual threads
        return executor;
    }
}
