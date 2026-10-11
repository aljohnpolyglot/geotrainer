-- Large merged backup rows can exceed the default eight-second API query limit.
alter role authenticated set statement_timeout = '60s';
notify pgrst, 'reload config';
