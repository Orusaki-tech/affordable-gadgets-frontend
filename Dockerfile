# Next.js standalone production image (Debian slim — lightningcss needs gnu libc, not Alpine musl)
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/api-client packages/api-client
RUN npm ci --include=optional && npm install --no-save \
    lightningcss-linux-x64-gnu@1.30.2 \
    @tailwindcss/oxide-linux-x64-gnu@4.1.16
COPY . .
ARG NEXT_PUBLIC_API_BASE_URL=https://api.affordable-gadgetske.com
ARG NEXT_PUBLIC_BRAND_CODE=AFFORDABLE_GADGETS
ARG NEXT_PUBLIC_BRAND_NAME=Affordable Gadgets KE
ARG NEXT_PUBLIC_SUPABASE_URL=https://esyyjswqnheibjbfsycx.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ueGt43IRaS_VjXrHzmz8uA_0K212yxu
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_BRAND_CODE=$NEXT_PUBLIC_BRAND_CODE
ENV NEXT_PUBLIC_BRAND_NAME=$NEXT_PUBLIC_BRAND_NAME
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN NODE_ENV=production npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 --ingroup nodejs nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
