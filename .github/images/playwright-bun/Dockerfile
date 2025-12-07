# Custom Playwright image with Bun pre-installed
# Extends official Playwright image to avoid installing unzip+bun on every CI run

ARG PLAYWRIGHT_VERSION=v1.57.0
FROM mcr.microsoft.com/playwright:${PLAYWRIGHT_VERSION}-noble

# Install unzip (required by bun) and clean up
RUN apt-get update && \
    apt-get install -y --no-install-recommends unzip && \
    rm -rf /var/lib/apt/lists/*

# Install bun
ARG BUN_VERSION=1.3.1
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v${BUN_VERSION}"

# Add bun to PATH for all users
ENV PATH="/root/.bun/bin:${PATH}"

# Verify installations
RUN bun --version && \
    npx playwright --version
