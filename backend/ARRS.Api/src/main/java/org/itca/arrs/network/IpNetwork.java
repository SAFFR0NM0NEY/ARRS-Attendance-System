package org.itca.arrs.network;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Arrays;

final class IpNetwork {
    private final byte[] network;
    private final int prefixLength;

    private IpNetwork(byte[] address, int prefixLength) {
        this.network = address.clone();
        this.prefixLength = prefixLength;
        maskNetworkAddress();
    }

    static IpNetwork parse(String cidr) {
        String[] parts = cidr.trim().split("/", -1);
        if (parts.length != 2 || parts[0].isBlank()) {
            throw new IllegalArgumentException("CIDR must include an address and prefix length.");
        }

        byte[] address = parseAddress(parts[0]);
        int prefix;
        try {
            prefix = Integer.parseInt(parts[1]);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("CIDR prefix must be a number.", exception);
        }

        if (prefix < 1 || prefix > address.length * 8) {
            throw new IllegalArgumentException("CIDR prefix is outside the address range.");
        }
        return new IpNetwork(address, prefix);
    }

    static byte[] parseAddress(String value) {
        if (value == null || value.isBlank() || value.contains("%")
                || !value.matches("[0-9a-fA-F:.]+")) {
            throw new IllegalArgumentException("Client address must be an IPv4 or IPv6 literal.");
        }
        if (value.indexOf(':') < 0) {
            String[] octets = value.split("\\.", -1);
            if (octets.length != 4) {
                throw new IllegalArgumentException("IPv4 address must contain four octets.");
            }
            byte[] address = new byte[4];
            for (int index = 0; index < octets.length; index++) {
                try {
                    if (octets[index].isEmpty() || (octets[index].length() > 1 && octets[index].startsWith("0"))) {
                        throw new NumberFormatException();
                    }
                    int octet = Integer.parseInt(octets[index]);
                    if (octet > 255) {
                        throw new NumberFormatException();
                    }
                    address[index] = (byte) octet;
                } catch (NumberFormatException exception) {
                    throw new IllegalArgumentException("Invalid IPv4 address.", exception);
                }
            }
            return address;
        }
        try {
            InetAddress address = InetAddress.getByName(value);
            if (!(address instanceof Inet6Address)) {
                throw new IllegalArgumentException("Expected an IPv6 address.");
            }
            return address.getAddress();
        } catch (UnknownHostException exception) {
            throw new IllegalArgumentException("Invalid IPv6 address.", exception);
        }
    }

    boolean contains(byte[] address) {
        if (address.length != network.length) {
            return false;
        }
        int wholeBytes = prefixLength / 8;
        int remainingBits = prefixLength % 8;
        if (!Arrays.equals(Arrays.copyOf(network, wholeBytes), Arrays.copyOf(address, wholeBytes))) {
            return false;
        }
        if (remainingBits == 0) {
            return true;
        }
        int mask = 0xff << (8 - remainingBits);
        return (network[wholeBytes] & mask) == (address[wholeBytes] & mask);
    }

    private void maskNetworkAddress() {
        int wholeBytes = prefixLength / 8;
        int remainingBits = prefixLength % 8;
        if (remainingBits > 0) {
            network[wholeBytes] = (byte) (network[wholeBytes] & (0xff << (8 - remainingBits)));
        }
        int firstZeroByte = wholeBytes + (remainingBits == 0 ? 0 : 1);
        Arrays.fill(network, firstZeroByte, network.length, (byte) 0);
    }
}
