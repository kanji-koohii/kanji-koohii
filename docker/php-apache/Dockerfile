#
#  Configs
#
#    Php inis
#      /etc/php/7.4/apache2/conf.d/koohii.php.ini
#
#    Php mods
#      /etc/php/7.4/mods-available/
#
#    Apache sites
#      /etc/apache2/sites-enabled/000-default.conf
#

FROM ubuntu:20.04

# makes  the  default  answers  be used for all questions
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update -y \
    && apt-get upgrade -y \
    && apt-get install software-properties-common -y \
    && apt-get update  -y \
    && apt-get upgrade -y

# Install utils
RUN apt-get install -yq --no-install-recommends \
    git \
    curl \
    less \
    nano \
    apt-utils \
    locales

# Install apache
RUN apt-get install -yq --no-install-recommends \
    apache2

# Install php
RUN apt-get install -yq --no-install-recommends \
    libapache2-mod-php7.4 \
    php7.4-bz2 \
    php7.4-cli \
    php7.4-json \
    php7.4-curl \
    php7.4-mbstring \
    php7.4-mysql \
    php7.4-xml \
    php7.4-zip
    # ------- tools ------
    # graphicsmagick \
    # imagemagick \
    # ghostscript \
    # iputils-ping \

# Clean
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# ======= composer =======
# RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# ======= nodejs 12.x required for Vite =======
RUN curl -fsSL https://deb.nodesource.com/setup_12.x | bash - && apt-get install -y nodejs

# Set locales
RUN locale-gen en_US.UTF-8 en_GB.UTF-8

RUN a2enmod rewrite expires

# Configure PHP
ADD koohii.php.ini /etc/php/7.4/apache2/conf.d/

# Configure vhost
ADD koohii.vhosts.conf /etc/apache2/sites-enabled/000-default.conf

# Cursor Up/Down to browse command history, Cursor Left/Right to move between command args
RUN cd /root \
    && printf '"\e[A": history-search-backward\n"\e[B": history-search-forward' > /root/.inputrc \
    && printf '\n\n"\e[1;5D": backward-word\n"\e[1;5C": forward-word' >> /root/.inputrc

# Setup a non-UTC timezone for checking the proper handling of dates & times in the app
ENV TZ=Europe/Brussels
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone


EXPOSE 80
EXPOSE 443
EXPOSE 8080
EXPOSE 8888

# for Vite dev server
EXPOSE 3000

RUN rm /var/www/html/index.html

CMD ["apache2ctl", "-D", "FOREGROUND"]