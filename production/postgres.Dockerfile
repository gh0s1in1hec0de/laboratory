FROM postgres:16

# Install pg_cron
RUN apt-get update &&  \
    apt-get -y install postgresql-16-cron && \
    apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ARG POSTGRES_DB
RUN echo "shared_preload_libraries='pg_cron'" >> /usr/share/postgresql/postgresql.conf.sample
RUN echo "cron.database_name='${POSTGRES_DB}'" >> /usr/share/postgresql/postgresql.conf.sample