package org.itca.arrs.network;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class IpNetworkTest {
    @Test
    void matchesIpv4NetworksAndRejectsOtherRanges() {
        IpNetwork network = IpNetwork.parse("192.0.2.0/24");

        assertTrue(network.contains(IpNetwork.parseAddress("192.0.2.14")));
        assertFalse(network.contains(IpNetwork.parseAddress("192.0.3.14")));
        assertFalse(network.contains(IpNetwork.parseAddress("2001:db8::1")));
    }

    @Test
    void matchesIpv6Networks() {
        IpNetwork network = IpNetwork.parse("2001:db8:1::/48");

        assertTrue(network.contains(IpNetwork.parseAddress("2001:db8:1::42")));
        assertFalse(network.contains(IpNetwork.parseAddress("2001:db8:2::42")));
    }

    @Test
    void rejectsHostnamesAndMalformedRanges() {
        assertThrows(IllegalArgumentException.class, () -> IpNetwork.parseAddress("example.org"));
        assertThrows(IllegalArgumentException.class, () -> IpNetwork.parse("192.0.2.1/99"));
        assertThrows(IllegalArgumentException.class, () -> IpNetwork.parseAddress("192.0.2.999"));
    }
}
