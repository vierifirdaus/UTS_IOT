# Menggunakan image Python sebagai base image
FROM python:3.13-alpine

# Set working directory di container
WORKDIR /app

# Menyalin file requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Menyalin sisa file aplikasi ke container
COPY . .

# Mengatur port yang digunakan
EXPOSE 5000

# Menjalankan aplikasi Flask
CMD ["python", "app.py"]
