package org.itca.arrs.network;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class CampusNetworkFilterTest {
    private static final String GATEWAY_SECRET = "test-only-gateway-secret-long-enough-123";

    @Test
    void allowsVerifiedCampusAddressAfterGatewayAuthentication() throws Exception {
        CampusNetworkFilter filter = new CampusNetworkFilter(properties());
        MockHttpServletRequest request = request("/api/attendance/check-in", "203.0.113.17");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean();

        filter.doFilterInternal(request, response, (ignoredRequest, ignoredResponse) -> continued.set(true));

        assertTrue(continued.get());
        assertEquals(200, response.getStatus());
    }

    @Test
    void rejectsSpoofedAddressWithoutTrustedGatewaySecret() throws Exception {
        CampusNetworkFilter filter = new CampusNetworkFilter(properties());
        MockHttpServletRequest request = request("/api/attendance/check-in", "203.0.113.17");
        request.removeHeader(CampusNetworkFilter.GATEWAY_TOKEN_HEADER);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean();

        filter.doFilterInternal(request, response, (ignoredRequest, ignoredResponse) -> continued.set(true));

        assertFalse(continued.get());
        assertEquals(403, response.getStatus());
    }

    @Test
    void appliesSeparateEmployeeNetworkAllowlist() throws Exception {
        CampusNetworkFilter filter = new CampusNetworkFilter(properties());
        MockHttpServletRequest request = request("/api/employees", "203.0.113.17");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean();

        filter.doFilterInternal(request, response, (ignoredRequest, ignoredResponse) -> continued.set(true));

        assertFalse(continued.get());
        assertEquals(403, response.getStatus());
    }

    @Test
    void rejectsDuplicateClientAddressHeaders() throws Exception {
        CampusNetworkFilter filter = new CampusNetworkFilter(properties());
        MockHttpServletRequest request = request("/api/attendance/check-in", "203.0.113.17");
        request.addHeader(CampusNetworkFilter.CLIENT_IP_HEADER, "198.51.100.10");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean();

        filter.doFilterInternal(request, response, (ignoredRequest, ignoredResponse) -> continued.set(true));

        assertFalse(continued.get());
        assertEquals(403, response.getStatus());
    }

    private static CampusNetworkProperties properties() {
        CampusNetworkProperties properties = new CampusNetworkProperties();
        properties.setGatewayToken(GATEWAY_SECRET);
        properties.setAttendanceCidrs(List.of("203.0.113.0/24"));
        properties.setEmployeeCidrs(List.of("198.51.100.0/24"));
        return properties;
    }

    private static MockHttpServletRequest request(String path, String address) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setServletPath(path);
        request.addHeader(CampusNetworkFilter.CLIENT_IP_HEADER, address);
        request.addHeader(CampusNetworkFilter.GATEWAY_TOKEN_HEADER, GATEWAY_SECRET);
        return request;
    }
}
