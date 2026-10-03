-- ============================================================================
-- Falcon 3D Prints — D1 Seed
-- Migration: 0002_seed_initial.sql
-- ============================================================================
-- Seeds ONLY:
--   1. The 6 approved navigation items
--   2. Default website_content entries copied directly from current live copy
-- STRICT RULE: NO products, NO projects.
-- ============================================================================

-- ─── Navigation Items ─────────────────────────────────────────────────────────
INSERT OR IGNORE INTO navigation_items (id, label, url, is_external, open_new_tab, is_visible, sort_order)
VALUES
  ('nav_services', 'SERVICES', '#lab', 0, 0, 1, 1),
  ('nav_work',     'WORK',     '#wall', 0, 0, 1, 2),
  ('nav_products', 'PRODUCTS', '/products', 0, 0, 1, 3),
  ('nav_process',  'PROCESS',  '#process', 0, 0, 1, 4),
  ('nav_about',    'ABOUT',    '#about', 0, 0, 1, 5),
  ('nav_contact',  'CONTACT',  '#contact', 0, 0, 1, 6);

-- ─── Website Content Defaults ─────────────────────────────────────────────────
INSERT OR IGNORE INTO website_content (section_key, content_json, updated_at)
VALUES
  (
    'hero',
    '{"h1":"Make it physical.","scrollWords":["IDEA","OBJECT","PHYSICAL."],"supportLine":"Custom 3D printing, prototyping & design from Nashik.","secondaryLine":"From digital concept to tangible object.","ctaPrimary":"START A CUSTOM PRINT","ctaSecondary":"VIEW OUR WORK","scrollAffordance":"SCROLL TO BUILD"}',
    unixepoch()
  ),
  (
    'process',
    '{"heading":"From idea to object.","turnaround":"DIRECT TURNAROUND FROM NASHIK","stages":[{"number":"01","label":"SHARE","description":"Tell us what you want to make.","tag":"DIRECT INQUIRY"},{"number":"02","label":"DESIGN","description":"We review your idea, reference or model and prepare it for printing.","tag":"3D PREPARATION"},{"number":"03","label":"PRINT","description":"The approved design is turned into a physical object.","tag":"ADDITIVE PRINT"},{"number":"04","label":"DELIVER","description":"Your finished print is ready for pickup or delivery.","tag":"PICKUP & DELIVERY"}]}',
    unixepoch()
  ),
  (
    'about',
    '{"heading":"Built to make ideas real.","kinetic":"REAL.","body":"Falcon 3D Prints is a Nashik-based 3D printing, prototyping and custom-design studio focused on turning ideas and digital concepts into tangible objects.","ownerName":"Rekha Pawar","ownerTitle":"Founder"}',
    unixepoch()
  ),
  (
    'contact',
    '{"heading":"Have something in mind?","supportingCopy":"Send us the idea, reference or file. We''ll help turn it into a printable object.","ctaPrimary":"START A CUSTOM PRINT","ctaWhatsapp":"CHAT ON WHATSAPP","readyLabel":"READY TO PRINT","receivedLabel":"RECEIVED","submitLabel":"START A CUSTOM PRINT","successMessage":"Got it. We''ll be in touch.","errorMessage":"Something went wrong. Please try again or contact Falcon directly.","brandEmail":"myfalcon3dprint@gmail.com","brandPhone":"+919850607144","brandLocation":"Nashik, Maharashtra"}',
    unixepoch()
  ),
  (
    'products_page',
    '{"heroEyebrow":"05 / FABRICATION CATALOG","heroHeadline":"Objects made to exist.","heroSubline":"Engineered housings, parametric geometries, and precision demonstrators manufactured by Falcon in Nashik.","ctaEnquire":"ENQUIRE ABOUT A PRODUCT","ctaCustom":"REQUEST A CUSTOM PRINT","emptyTitle":"00 / NO PRODUCTS CURRENTLY RELEASED","emptyText":"Studio production runs and limited editions are prepared in batches. Inquire for custom fabrication."}',
    unixepoch()
  );
