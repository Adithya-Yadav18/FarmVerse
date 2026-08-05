package com.farmverse.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping
    public String testEndpoint() {
        return "Success! Your JWT token is valid and you reached the protected endpoint!";
    }
}