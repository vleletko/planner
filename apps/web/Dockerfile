FROM oven/bun:1.3.1-slim AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy pre-built standalone output from CI
# Standalone output contains full monorepo structure (apps/web/)
COPY --chown=nextjs:nodejs .next/standalone ./

# Copy static assets into standalone structure
# Note: .next/static is NOT included in standalone, must be copied separately
COPY --chown=nextjs:nodejs .next/static ./apps/web/.next/static

# Switch to non-root user
USER nextjs

EXPOSE 3000

CMD ["bun", "apps/web/server.js"]
