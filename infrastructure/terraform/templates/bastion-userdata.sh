#!/bin/bash
# Bastion Host User Data Script

# Update system
yum update -y

# Install essential tools
yum install -y \
  postgresql15 \
  redis6 \
  git \
  vim \
  htop \
  nmap \
  telnet \
  jq \
  aws-cli

# Install Docker
amazon-linux-extras install docker -y
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
mv kubectl /usr/local/bin/

# Install Node.js (for database migrations)
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Configure SSH hardening
cat >> /etc/ssh/sshd_config <<EOF
PermitRootLogin no
PasswordAuthentication no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

systemctl restart sshd

# Configure automatic security updates
yum install -y yum-cron
sed -i 's/apply_updates = no/apply_updates = yes/' /etc/yum/yum-cron.conf
systemctl enable yum-cron
systemctl start yum-cron

# Set up audit logging
auditctl -w /etc/passwd -p wa -k passwd_changes
auditctl -w /etc/shadow -p wa -k shadow_changes
auditctl -w /etc/sudoers -p wa -k sudoers_changes

# Create project directory
mkdir -p /home/ec2-user/${project_name}
chown ec2-user:ec2-user /home/ec2-user/${project_name}

# Create useful aliases
cat >> /home/ec2-user/.bashrc <<'EOF'
# Aliases
alias ll='ls -alh'
alias psql-prod='psql -h $RDS_ENDPOINT -U $DB_USERNAME -d $DB_NAME'
alias redis-prod='redis-cli -h $REDIS_ENDPOINT -p 6379 -a $REDIS_PASSWORD'
alias logs='aws logs tail /ecs/${project_name}-${environment} --follow'

# Environment indicator
export PS1="\[\033[01;31m\][BASTION-${environment}]\[\033[00m\] \u@\h:\w\$ "
EOF

# Set up log rotation
cat > /etc/logrotate.d/bastion <<EOF
/var/log/bastion/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
}
EOF

# Create connection scripts
cat > /home/ec2-user/connect-db.sh <<'EOF'
#!/bin/bash
source /home/ec2-user/.env
psql -h $RDS_ENDPOINT -U $DB_USERNAME -d $DB_NAME
EOF

cat > /home/ec2-user/connect-redis.sh <<'EOF'
#!/bin/bash
source /home/ec2-user/.env
redis-cli -h $REDIS_ENDPOINT -p 6379 -a $REDIS_PASSWORD
EOF

chmod +x /home/ec2-user/connect-*.sh
chown ec2-user:ec2-user /home/ec2-user/connect-*.sh

# Install fail2ban for additional security
amazon-linux-extras install epel -y
yum install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Send notification that bastion is ready
aws sns publish \
  --topic-arn "${sns_topic_arn}" \
  --subject "Bastion Host Ready" \
  --message "Bastion host for ${project_name}-${environment} is now ready. IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"

echo "Bastion host setup completed!"