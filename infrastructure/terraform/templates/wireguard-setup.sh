#!/bin/bash
# WireGuard VPN Server Setup Script

set -e

# Update system
apt-get update
apt-get upgrade -y

# Install WireGuard
apt-get install -y wireguard wireguard-tools iptables

# Enable IP forwarding
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
echo "net.ipv6.conf.all.forwarding=1" >> /etc/sysctl.conf
sysctl -p

# Generate server keys
cd /etc/wireguard
umask 077
wg genkey | tee server_private_key | wg pubkey > server_public_key

# Create server configuration
cat > /etc/wireguard/wg0.conf <<EOF
[Interface]
Address = ${vpn_cidr}
PrivateKey = $(cat server_private_key)
ListenPort = ${vpn_port}
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
SaveConfig = true

# DNS
DNS = ${dns_servers}
EOF

# Create client configuration template
mkdir -p /etc/wireguard/clients

cat > /etc/wireguard/clients/client-template.conf <<EOF
[Interface]
PrivateKey = CLIENT_PRIVATE_KEY
Address = CLIENT_IP/32
DNS = ${dns_servers}

[Peer]
PublicKey = $(cat /etc/wireguard/server_public_key)
Endpoint = ${domain_name}:${vpn_port}
AllowedIPs = 10.0.0.0/8, 172.16.0.0/12
PersistentKeepalive = 25
EOF

# Script to add new clients
cat > /usr/local/bin/add-vpn-client <<'SCRIPT'
#!/bin/bash

CLIENT_NAME=$1
if [ -z "$CLIENT_NAME" ]; then
    echo "Usage: $0 <client-name>"
    exit 1
fi

cd /etc/wireguard

# Generate client keys
wg genkey | tee clients/${CLIENT_NAME}_private_key | wg pubkey > clients/${CLIENT_NAME}_public_key

# Get next available IP
LAST_IP=$(grep -E "^10\.200\.0\." wg0.conf | tail -1 | cut -d' ' -f3 | cut -d'.' -f4 | cut -d'/' -f1)
NEXT_IP=$((LAST_IP + 1))
CLIENT_IP="10.200.0.${NEXT_IP}"

# Add peer to server config
cat >> wg0.conf <<EOF

# ${CLIENT_NAME}
[Peer]
PublicKey = $(cat clients/${CLIENT_NAME}_public_key)
AllowedIPs = ${CLIENT_IP}/32
EOF

# Create client config
sed -e "s|CLIENT_PRIVATE_KEY|$(cat clients/${CLIENT_NAME}_private_key)|g" \
    -e "s|CLIENT_IP|${CLIENT_IP}|g" \
    clients/client-template.conf > clients/${CLIENT_NAME}.conf

# Generate QR code
apt-get install -y qrencode
qrencode -t png -o clients/${CLIENT_NAME}.png < clients/${CLIENT_NAME}.conf

# Restart WireGuard
systemctl restart wg-quick@wg0

echo "Client configuration created: /etc/wireguard/clients/${CLIENT_NAME}.conf"
echo "QR code created: /etc/wireguard/clients/${CLIENT_NAME}.png"
SCRIPT

chmod +x /usr/local/bin/add-vpn-client

# Enable and start WireGuard
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

# Install fail2ban for additional security
apt-get install -y fail2ban

# Configure fail2ban for SSH
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Setup unattended upgrades
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Create admin user
useradd -m -s /bin/bash -G sudo vpnadmin
mkdir -p /home/vpnadmin/.ssh
echo "ssh-rsa YOUR_PUBLIC_KEY" > /home/vpnadmin/.ssh/authorized_keys
chown -R vpnadmin:vpnadmin /home/vpnadmin/.ssh
chmod 700 /home/vpnadmin/.ssh
chmod 600 /home/vpnadmin/.ssh/authorized_keys

# Monitoring script
cat > /usr/local/bin/vpn-monitor.sh <<'MONITOR'
#!/bin/bash

# Check WireGuard status
if ! systemctl is-active --quiet wg-quick@wg0; then
    echo "WireGuard is down! Attempting restart..."
    systemctl restart wg-quick@wg0
    
    # Send alert (configure your alerting here)
    # curl -X POST https://api.truelabel.com.br/alerts/vpn-down
fi

# Log active connections
wg show > /var/log/wireguard-status.log
MONITOR

chmod +x /usr/local/bin/vpn-monitor.sh

# Add to crontab
echo "*/5 * * * * /usr/local/bin/vpn-monitor.sh" | crontab -

echo "WireGuard VPN setup complete!"
echo "Server public key: $(cat /etc/wireguard/server_public_key)"
echo "To add clients, run: add-vpn-client <client-name>"