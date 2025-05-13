@ -0,0 +1,43 @@

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Table: public.family
CREATE TABLE IF NOT EXISTS public.family (
    id integer NOT NULL,
    latin_name text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT family_pkey PRIMARY KEY (id)
);
ALTER TABLE IF EXISTS public.family OWNER to postgres;

-- Table: public.species
CREATE TABLE IF NOT EXISTS public.species (
    speciesid SERIAL PRIMARY KEY,
    rarity text COLLATE pg_catalog."default",
    latinname text COLLATE pg_catalog."default",
    germanname text COLLATE pg_catalog."default",
    family_id integer,
    CONSTRAINT fk_species_family FOREIGN KEY (family_id)
        REFERENCES public.family (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
);
ALTER TABLE IF EXISTS public.species OWNER TO postgres;

-- Table: public.observations
CREATE TABLE IF NOT EXISTS public.observations (
	observationid SERIAL PRIMARY KEY,
    date timestamp without time zone,
    speciesid integer,
    geom geometry(PointZ,4326),
	landcover TEXT,
    CONSTRAINT observation_speciesid_fkey FOREIGN KEY (speciesid)
        REFERENCES public.species (speciesid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);
ALTER TABLE IF EXISTS public.observations OWNER to postgres;

-- Unique index on observations
CREATE UNIQUE INDEX IF NOT EXISTS observations_unique
    ON public.observations (date ASC NULLS LAST, speciesid ASC NULLS LAST, geom ASC NULLS LAST);