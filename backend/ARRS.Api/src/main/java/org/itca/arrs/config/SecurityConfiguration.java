package org.itca.arrs.config;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.itca.arrs.network.CampusNetworkFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;

@Configuration
public class SecurityConfiguration {
    @Bean
    JwtDecoder jwtDecoder(
            @Value("${security.jwt.jwks-uri}") String jwksUri,
            @Value("${security.jwt.issuer}") String issuer,
            @Value("${security.jwt.audience}") String audience) {
        URI jwksAddress = URI.create(jwksUri);
        URI issuerAddress = URI.create(issuer);
        if (!"https".equalsIgnoreCase(jwksAddress.getScheme())
                || !"https".equalsIgnoreCase(issuerAddress.getScheme())
                || jwksAddress.getHost() == null
                || !jwksAddress.getHost().equalsIgnoreCase(issuerAddress.getHost())
                || audience.isBlank()) {
            throw new IllegalStateException("Configure HTTPS Supabase JWT issuer/JWKS URLs and an audience.");
        }
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwksUri)
                .jwsAlgorithm(SignatureAlgorithm.ES256)
                .jwsAlgorithm(SignatureAlgorithm.RS256)
                .build();
        OAuth2TokenValidator<Jwt> audienceValidator = token ->
                token.getAudience().contains(audience)
                        ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(
                                new OAuth2Error("invalid_token", "Required audience is missing", null));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuer), audienceValidator));
        return decoder;
    }

    @Bean
    Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new SystemRoleAuthoritiesConverter());
        return converter;
    }

    @Bean
    FilterRegistrationBean<CampusNetworkFilter> disableContainerFilterRegistration(
            CampusNetworkFilter campusNetworkFilter) {
        FilterRegistrationBean<CampusNetworkFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(campusNetworkFilter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            CampusNetworkFilter campusNetworkFilter,
            Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter)
            throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/attendance/sessions").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.POST, "/api/attendance/device").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.POST, "/api/attendance/check-in").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.POST, "/api/attendance/sessions")
                        .hasAnyRole("TRAINER", "FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/attendance/overrides")
                        .hasAnyRole("TRAINER", "FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/attendance/device-reset").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/employees").hasAnyRole("EMPLOYEE", "EMPLOYEE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/employees/departments")
                        .hasAnyRole("EMPLOYEE", "EMPLOYEE_ADMIN")
                        .requestMatchers("/api/attendance/**").hasAnyRole("TRAINER", "FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/employees/me").hasAnyRole("EMPLOYEE", "EMPLOYEE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/employees/**").hasRole("EMPLOYEE_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/employees/**").hasRole("EMPLOYEE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/employees/**").hasRole("EMPLOYEE_ADMIN")
                        .requestMatchers("/api/employees/**").hasRole("EMPLOYEE_ADMIN")
                        .anyRequest().denyAll())
                .oauth2ResourceServer(resourceServer -> resourceServer
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)))
                .addFilterAfter(campusNetworkFilter, BearerTokenAuthenticationFilter.class)
                .build();
    }

    private static final class SystemRoleAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {
        private static final List<String> ALLOWED_ROLES =
                List.of("student", "trainer", "faculty", "admin", "employee", "employee_admin");

        @Override
        public Collection<GrantedAuthority> convert(Jwt jwt) {
            Object metadataValue = jwt.getClaims().get("app_metadata");
            if (!(metadataValue instanceof Map<?, ?> metadata)) {
                return List.of();
            }

            Object rolesValue = metadata.get("system_roles");
            if (!(rolesValue instanceof List<?> roles)) {
                return List.of();
            }

            return roles.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .filter(ALLOWED_ROLES::contains)
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase(Locale.ROOT)))
                    .map(GrantedAuthority.class::cast)
                    .toList();
        }
    }
}
