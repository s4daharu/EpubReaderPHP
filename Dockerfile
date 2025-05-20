# Use an official PHP image with Apache
FROM php:8.1-apache

# Install required PHP extensions
RUN apt-get update && apt-get install -y \
    libzip-dev \
    zlib1g-dev \
    libpng-dev \ 
    libjpeg-dev \ 
    libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd zip 

# Set the working directory in the container
WORKDIR /var/www/html

# Copy application files from your host to the container's webroot
COPY . .

# Create the 'uploads' directory and set appropriate permissions
RUN mkdir -p uploads \
    && chown -R www-data:www-data uploads \
    && chmod -R 775 uploads

# (Optional) Increase PHP upload limits if needed
COPY custom-php.ini /usr/local/etc/php/conf.d/custom-uploads.ini