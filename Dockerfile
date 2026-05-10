FROM node:22-bullseye

# Install all system dependencies required by Chromium/Chrome
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libx11-6 \
    libxrandr2 \
    libxinerama1 \
    libxcursor1 \
    libxi6 \
    libxtst6 \
    libxext6 \
    libxss1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrender1 \
    libfreetype6 \
    libfontconfig1 \
    fonts-liberation \
    libgl1-mesa-glx \
    libgbm1 \
    libdrm2 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libgtk-3-0 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    ca-certificates \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package.json ./
COPY package-lock.json* ./

RUN npm install

# Copy the rest of the application source
COPY . .

EXPOSE 2000

CMD ["npm", "start"]
