-- Add new platforms to platform enum
ALTER TYPE platform ADD VALUE IF NOT EXISTS 'opinions';
ALTER TYPE platform ADD VALUE IF NOT EXISTS 'probable';
ALTER TYPE platform ADD VALUE IF NOT EXISTS 'divvybet';