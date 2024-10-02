FROM postgres:16

# Install pg_cron
RUN apt-get update &&  \
    apt-get -y install postgresql-16-cron && \
    apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN echo "shared_preload_libraries = 'pg_cron'" >> /var/lib/postgresql/data/postgresql.conf && \
    echo "cron.database_name = 'launchpad'" >> /var/lib/postgresql/data/postgresql.conf
