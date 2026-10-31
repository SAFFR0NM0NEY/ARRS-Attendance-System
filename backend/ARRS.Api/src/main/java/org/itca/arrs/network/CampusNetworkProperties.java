package org.itca.arrs.network;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "security.network")
public class CampusNetworkProperties {
    private String gatewayToken;
    private List<String> attendanceCidrs = List.of();
    private List<String> employeeCidrs = List.of();

    public String getGatewayToken() {
        return gatewayToken;
    }

    public void setGatewayToken(String gatewayToken) {
        this.gatewayToken = gatewayToken;
    }

    public List<String> getAttendanceCidrs() {
        return attendanceCidrs;
    }

    public void setAttendanceCidrs(List<String> attendanceCidrs) {
        this.attendanceCidrs = attendanceCidrs == null ? List.of() : List.copyOf(attendanceCidrs);
    }

    public List<String> getEmployeeCidrs() {
        return employeeCidrs;
    }

    public void setEmployeeCidrs(List<String> employeeCidrs) {
        this.employeeCidrs = employeeCidrs == null ? List.of() : List.copyOf(employeeCidrs);
    }
}
