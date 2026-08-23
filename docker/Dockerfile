# ShqipAI Cybersecurity Lab Container
# Ubuntu-based image with security tools for educational purposes

FROM ubuntu:22.04

# Prevent interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Install security tools and utilities
RUN apt-get update && apt-get install -y \
    # Network tools
    nmap \
    net-tools \
    iputils-ping \
    curl \
    wget \
    netcat-openbsd \
    whois \
    dnsutils \
    iproute2 \
    tcpdump \
    # Python for scripting
    python3 \
    python3-pip \
    python3-venv \
    # Text editors
    vim \
    nano \
    # Version control
    git \
    # Build tools
    build-essential \
    # Crypto tools
    openssl \
    # File utilities
    file \
    binutils \
    # Cleanup
    && rm -rf /var/lib/apt/lists/*

# Create non-root student user for safety
RUN useradd -m -s /bin/bash -u 1000 student

# Create workspace directory
RUN mkdir -p /home/student/workspace && chown -R student:student /home/student

# Set up Python virtual environment for student
RUN python3 -m venv /home/student/.venv && chown -R student:student /home/student/.venv

# Switch to student user
USER student
WORKDIR /home/student/workspace

# Set environment
ENV PATH="/home/student/.venv/bin:$PATH"
ENV HOME="/home/student"
ENV TERM="xterm-256color"

# Default command
CMD ["/bin/bash"]
