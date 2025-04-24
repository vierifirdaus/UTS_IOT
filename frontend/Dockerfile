# Menggunakan node sebagai base image
FROM node:23-alpine

# Set working directory di container
WORKDIR /app

# Menyalin package.json dan package-lock.json ke container
COPY package*.json ./

# Install dependencies
RUN npm install

# Menyalin sisa file aplikasi ke container
COPY . .

# Build aplikasi React
RUN npm run build

# Mengatur port yang digunakan
EXPOSE 3000

# Menjalankan aplikasi React
CMD ["npm", "start"]
