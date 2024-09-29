FROM postgres:16

# Install pg_cron
RUN apt-get update &&  \
    apt-get -y install postgresql-16-cron && \
    apt-get clean \
    && rm -rf /var/lib/apt/lists/*