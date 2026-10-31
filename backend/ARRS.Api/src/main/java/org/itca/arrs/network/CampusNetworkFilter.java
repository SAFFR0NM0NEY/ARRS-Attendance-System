package org.itca.arrs.network;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class CampusNetworkFilter extends OncePerRequestFilter {
    private static final Logger LOGGER = LoggerFactory.getLogger(CampusNetworkFilter.class);
    static final String CLIENT_IP_HEADER = "X-Verified-Client-IP";
    static final String GATEWAY_TOKEN_HEADER = "X-Trusted-Gateway-Token";

    private final CampusNetworkProperties properties;
    private final List<IpNetwork> attendanceNetworks;
    private final List<IpNetwork> employeeNetworks;

    public CampusNetworkFilter(CampusNetworkProperties properties) {
        this.properties = properties;
        this.attendanceNetworks = parseNetworks(properties.getAttendanceCidrs(), "attendance");
        this.employeeNetworks = parseNetworks(properties.getEmployeeCidrs(), "employee");
        if (properties.getGatewayToken() == null || properties.getGatewayToken().length() < 32) {
            throw new IllegalStateException("SECURITY_NETWORK_GATEWAY_TOKEN must contain at least 32 characters.");
        }
        if (attendanceNetworks.isEmpty() || employeeNetworks.isEmpty()) {
            throw new IllegalStateException("Campus CIDR allowlists must be configured for both systems.");
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return !isProtectedSystemPath(path);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String suppliedGatewayToken = readSingleHeader(request, GATEWAY_TOKEN_HEADER);
        if (!constantTimeEquals(properties.getGatewayToken(), suppliedGatewayToken)) {
            LOGGER.warn("Denied request to {} without trusted gateway authentication.", request.getServletPath());
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Request did not come through the trusted gateway.");
            return;
        }

        String clientIp = readSingleHeader(request, CLIENT_IP_HEADER);
        if (clientIp == null || clientIp.contains(",") || clientIp.length() > 64) {
            LOGGER.warn("Denied request to {} without one verified client address.", request.getServletPath());
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "A verified client address is required.");
            return;
        }

        byte[] address;
        try {
            address = IpNetwork.parseAddress(clientIp.trim());
        } catch (IllegalArgumentException exception) {
            LOGGER.warn("Denied request to {} with an invalid verified client address.", request.getServletPath());
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "The verified client address is invalid.");
            return;
        }

        List<IpNetwork> allowedNetworks = request.getServletPath().startsWith("/api/attendance")
                ? attendanceNetworks
                : employeeNetworks;
        boolean allowed = allowedNetworks.stream().anyMatch(network -> network.contains(address));
        if (!allowed) {
            LOGGER.warn("Denied request to {} from a non-approved network.", request.getServletPath());
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "This network is not approved for this system.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static boolean isProtectedSystemPath(String path) {
        return path.equals("/api/attendance")
                || path.startsWith("/api/attendance/")
                || path.equals("/api/employees")
                || path.startsWith("/api/employees/");
    }

    private static String readSingleHeader(HttpServletRequest request, String name) {
        var values = request.getHeaders(name);
        if (!values.hasMoreElements()) {
            return null;
        }
        String value = values.nextElement();
        return values.hasMoreElements() ? null : value;
    }

    private static boolean constantTimeEquals(String expected, String supplied) {
        if (expected == null || supplied == null) {
            return false;
        }
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                supplied.getBytes(StandardCharsets.UTF_8));
    }

    private static List<IpNetwork> parseNetworks(List<String> cidrs, String systemName) {
        try {
            return cidrs.stream().map(IpNetwork::parse).toList();
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("Invalid " + systemName + " CIDR allowlist.", exception);
        }
    }
}
