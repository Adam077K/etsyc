-- ============================================================================
-- KOL — seed.sql
-- The prototype's content, as real rows, so the deployed app shows what the
-- prototype shows.
-- ============================================================================
--
--   SOURCE OF TRUTH: `apps/kol/src/lib/mock/db.ts` (makers, products,
--   provenance, the 11 P14 spec fields, reviews, Q&A, orders) plus the two
--   store-config fixtures `apps/kol/src/lib/store-config/fixtures/sena.ts` and
--   `.../custom.ts` (the D4 jsonb worlds).
--
--   ⚠ STAGING AND DEMO PROJECTS ONLY. This file inserts five fake sellers and
--   five fake buyers into `auth.users`. Never run it against a project that
--   holds real accounts.
--
--   Idempotent: every row has a fixed UUID and an ON CONFLICT clause, so
--   re-running refreshes the content rather than duplicating it.
--
--   Run it as a privileged role (psql with the connection string, or the SQL
--   Editor). It writes to `orders`, `order_items`, `verifications.status` and
--   `badges`, which have no client write path at all by design — the seed
--   relies on RLS bypass, exactly as the Stripe webhook and the verification
--   resolver will in production.
--
--   PROVENANCE CONFLICTS FOUND WHILE WRITING THIS FILE (not silently resolved):
--     1. `stores.handle` — the mock uses maker slugs (`sena`, `noor`) for its
--        routes; the config fixtures carry `maker.handle` = `ashwork` /
--        `tinctura`. The column is seeded with the ROUTE slug so `/m/[slug]`
--        resolves; the studio name stays inside the jsonb.
--     2. Inventory disagrees between the two sources. `db.ts` says the ridge
--        tumbler is in-stock ×7 and the shibori throw is made-to-order; the
--        config fixtures say the opposite for both. The COLUMNS are seeded from
--        `db.ts` because the columns are what `create_order()` reads. The
--        configs are seeded verbatim and therefore still disagree — the D4
--        renderer will show the config's figures. Reconcile before launch.
--     3. Noor's verification state disagrees. `db.ts` has `verified: true`;
--        `custom.ts` has `trust.realMaker.status: "pending"`. Seeded as
--        VERIFIED per db.ts; her config blob still reads pending.
--     4. Config clip ids (`clip_intro`, `clip_vat`) are symbolic strings, not
--        UUIDs, so they cannot equal a `videos.id` — which is the ADR-0001 OQ-2
--        invariant. The seed records the symbolic id in `videos.src`'s sibling
--        comment and uses real UUIDs for the rows. This must be resolved before
--        the video engine ships. See the note at GROUP 03 below.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- REQUIRED: declare this session as the service role for the guard triggers.
--
-- `guard_profile_role`, `guard_commission` and `enforce_review_seller_scope`
-- all test `auth.role() = 'service_role'` EXPLICITLY (ADR-0001 note N1 — the
-- older `auth.uid() is null` idiom was a bypass, because anon also has a null
-- uid). Running this file over a plain psql connection leaves the JWT claims
-- unset, so `auth.role()` returns NULL, which is "not the service role" — and
-- promoting a maker to 'seller' below would be REJECTED by the role guard.
--
-- Setting the claim locally makes the seed take the same trusted-server path
-- production uses. `true` scopes it to this transaction only.
-- ----------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

-- ============================================================================
-- 0 · ACCOUNTS
-- ----------------------------------------------------------------------------
-- Inserting into `auth.users` fires `handle_new_user`, which seeds each profile
-- with role='buyer'. The five makers are then promoted to 'seller' — which is
-- exactly the service-role path seller onboarding uses in production, and a
-- live demonstration that `guard_profile_role` allows it for this role and no
-- other.
-- ============================================================================

do $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values
    -- makers
    ('00000000-0000-0000-0000-000000000000','11111111-1111-4111-8111-000000000001','authenticated','authenticated','sena@kol.invalid','', now(),'{"provider":"email","providers":["email"]}','{"display_name":"Sena"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000','11111111-1111-4111-8111-000000000002','authenticated','authenticated','noor@kol.invalid','', now(),'{"provider":"email","providers":["email"]}','{"display_name":"Noor"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000','11111111-1111-4111-8111-000000000003','authenticated','authenticated','tomas@kol.invalid','', now(),'{"provider":"email","providers":["email"]}','{"display_name":"Tomas"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000','11111111-1111-4111-8111-000000000004','authenticated','authenticated','mira@kol.invalid','', now(),'{"provider":"email","providers":["email"]}','{"display_name":"Mira"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000','11111111-1111-4111-8111-000000000005','authenticated','authenticated','elias@kol.invalid','', now(),'{"provider":"email","providers":["email"]}','{"display_name":"Elias"}', now(), now()),
    -- buyers
    ('00000000-0000-0000-0000-000000000000','11111111-1111-4111-8111-00000000000a','authenticated','authenticated','priya@kol.invalid','', now(),'{"provider":"email","providers":["email"]}','{"display_name":"Priya"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000','11111111-1111-4111-8111-00000000000b','authenticated','authenticated','devon@kol.invalid','', now(),'{"provider":"email","providers":["email"]}','{"display_name":"Devon"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000','11111111-1111-4111-8111-00000000000c','authenticated','authenticated','sam@kol.invalid','', now(),'{"provider":"email","providers":["email"]}','{"display_name":"Sam"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000','11111111-1111-4111-8111-00000000000d','authenticated','authenticated','marta@kol.invalid','', now(),'{"provider":"email","providers":["email"]}','{"display_name":"Marta"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000','11111111-1111-4111-8111-00000000000e','authenticated','authenticated','demo@kol.invalid','', now(),'{"provider":"email","providers":["email"]}','{"display_name":"Alex"}', now(), now())
  on conflict (id) do nothing;
exception when others then
  raise exception
    'seed: could not write auth.users (%). Create the ten accounts through the Supabase Auth API instead, then re-run this file with their ids substituted for the 1111... uuids below.', sqlerrm;
end $$;

-- Profiles: the trigger already made these as buyers. Fill in the public
-- identity and promote the five makers.
insert into public.profiles (id, role, display_name, handle, bio) values
  ('11111111-1111-4111-8111-000000000001','seller','Sena','sena',  'Twelve years, one wheel. Ash-glazed stoneware fired slow.'),
  ('11111111-1111-4111-8111-000000000002','seller','Noor','noor',  'She learned the vat from her grandmother, who kept one alive for thirty years.'),
  ('11111111-1111-4111-8111-000000000003','seller','Tomas','tomas','Green wood moves as it dries. That''s the material talking.'),
  ('11111111-1111-4111-8111-000000000004','seller','Mira','mira',  'A pan takes four days. Most of that is listening to the metal.'),
  ('11111111-1111-4111-8111-000000000005','seller','Elias','elias','Every book opens flat or it goes back on the bench.'),
  ('11111111-1111-4111-8111-00000000000a','buyer','Priya','priya', null),
  ('11111111-1111-4111-8111-00000000000b','buyer','Devon','devon', null),
  ('11111111-1111-4111-8111-00000000000c','buyer','Sam','sam',     null),
  ('11111111-1111-4111-8111-00000000000d','buyer','Marta','marta', null),
  ('11111111-1111-4111-8111-00000000000e','buyer','Alex','alex',   null)
on conflict (id) do update set
  role         = excluded.role,
  display_name = excluded.display_name,
  handle       = excluded.handle,
  bio          = excluded.bio,
  updated_at   = now();


-- ============================================================================
-- 1 · BLOCK CATALOG (platform reference data)
-- ----------------------------------------------------------------------------
-- OQ-1: the block TYPES the one renderer supports. Every (type, variant) pair
-- used by the two seeded worlds must exist here or the renderer has nothing to
-- compose with.
-- ============================================================================

insert into public.blocks (type, variant, prop_schema_ref) values
  ('hero-video',       'center-column',          'zod:blocks.heroVideo'),
  ('hero-video',       'full-bleed',             'zod:blocks.heroVideo'),
  ('craft-story',      'text-left-media-right',  'zod:blocks.craftStory'),
  ('craft-story',      'stacked-editorial',      'zod:blocks.craftStory'),
  ('process-reel',     'single-reel',            'zod:blocks.processReel'),
  ('product-showcase', 'featured-single',        'zod:blocks.productShowcase'),
  ('product-showcase', 'masonry',                'zod:blocks.productShowcase'),
  ('voice-quote',      'text+waveform',          'zod:blocks.voiceQuote'),
  ('atmosphere',       'block-ground',           'zod:blocks.atmosphere'),
  ('trust-badge',      'expandable-detail',      'zod:blocks.trustBadge'),
  ('contact-cta',      'footer-strip',           'zod:blocks.contactCta')
on conflict (type, variant) do update set prop_schema_ref = excluded.prop_schema_ref;


-- ============================================================================
-- 2 · CATEGORIES (browse taxonomy, OQ-6)
-- ============================================================================

insert into public.categories (id, slug, name, parent_id) values
  ('0a0a0a0a-0000-4000-8000-000000000001','ceramics',   'Ceramics',    null),
  ('0a0a0a0a-0000-4000-8000-000000000002','textiles',   'Textiles',    null),
  ('0a0a0a0a-0000-4000-8000-000000000003','woodwork',   'Woodwork',    null),
  ('0a0a0a0a-0000-4000-8000-000000000004','metalwork',  'Metalwork',   null),
  ('0a0a0a0a-0000-4000-8000-000000000005','bookbinding','Bookbinding', null),
  ('0a0a0a0a-0000-4000-8000-000000000011','tableware',  'Tableware',   '0a0a0a0a-0000-4000-8000-000000000001'),
  ('0a0a0a0a-0000-4000-8000-000000000012','home-linens','Home linens', '0a0a0a0a-0000-4000-8000-000000000002')
on conflict (id) do update set slug = excluded.slug, name = excluded.name, parent_id = excluded.parent_id;


-- ============================================================================
-- 3 · STORES
-- ----------------------------------------------------------------------------
-- `handle` is the ROUTE slug (see conflict note 1 in the header). `config` is
-- the verbatim D4 fixture for the two makers who have a full world; the other
-- three carry a minimal identity-only config — in the prototype these three are
-- `hasWorld: false` feed-depth makers, and a designed-empty world is a more
-- honest deployed state than a 404 or a half-rendered one.
-- ============================================================================

insert into public.stores (id, owner_id, handle, name, craft, bio, published, config) values
  ('22222222-2222-4222-8222-000000000001','11111111-1111-4111-8111-000000000001','sena','Ashwork Ceramics','Wheel-thrown stoneware, ash glazes','Twelve years, one wheel. Ash-glazed stoneware fired slow.', true,
   $sena_cfg${
  "schemaVersion": "1.2",
  "storeId": "a7f3-ashwork",
  "maker": {
    "id": "mk_sena",
    "displayName": "Sena Okonkwo",
    "handle": "ashwork",
    "craft": "hand-thrown stoneware, wood-ash glazes",
    "location": "Lagos & London",
    "bio": "I throw in small batches and fire with ash from my father’s workshop. Every piece keeps the mark of the wheel.",
    "avatarMediaId": "img_sena_portrait",
    "trust": {
      "realMaker": {
        "status": "verified",
        "verifiedAt": "2026-07-12T09:20:00Z",
        "voiceAnchorClipId": "clip_intro"
      },
      "aiTransparency": {
        "level": "ai-assisted",
        "disclosure": "Sena wrote every word. KOL’s AI suggested the layout and picked the palette; Sena approved each section.",
        "aiAssistedFields": [
          "layout",
          "palette"
        ]
      }
    }
  },
  "theme": {
    "kind": "curated",
    "paletteId": "sunbaked",
    "mode": "light",
    "fontPairingId": "statement-grotesk",
    "motionPreset": "fluid",
    "radiusIdentity": "soft",
    "density": "airy"
  },
  "media": {
    "clips": [
      {
        "id": "clip_intro",
        "kind": "video",
        "src": "/media/ashwork/intro.mp4",
        "poster": "/media/ashwork/intro-poster.svg",
        "durationMs": 41000,
        "captionsSrc": "/media/ashwork/intro.vtt",
        "videoProfile": {
          "purpose": [
            "intro"
          ],
          "pageEligibility": [
            "feed",
            "grown",
            "world"
          ],
          "productLinks": [],
          "mood": [
            "warm",
            "intimate"
          ],
          "antiRepetitionKey": "sena-intro"
        }
      },
      {
        "id": "clip_wheel",
        "kind": "video",
        "src": "/media/ashwork/wheel.mp4",
        "poster": "/media/ashwork/wheel-poster.svg",
        "durationMs": 28000,
        "captionsSrc": "/media/ashwork/wheel.vtt",
        "videoProfile": {
          "purpose": [
            "process"
          ],
          "pageEligibility": [
            "world"
          ],
          "productLinks": [],
          "mood": [
            "calm"
          ],
          "antiRepetitionKey": "sena-wheel"
        }
      },
      {
        "id": "clip_tumbler",
        "kind": "video",
        "src": "/media/ashwork/tumbler.mp4",
        "poster": "/media/ashwork/ridge-tumbler.svg",
        "durationMs": 19000,
        "captionsSrc": "/media/ashwork/tumbler.vtt",
        "videoProfile": {
          "purpose": [
            "product-narration"
          ],
          "pageEligibility": [
            "product"
          ],
          "productLinks": [
            "p_ridge_tumbler"
          ],
          "mood": [
            "intimate"
          ],
          "antiRepetitionKey": "sena-tumbler"
        }
      },
      {
        "id": "clip_thanks",
        "kind": "video",
        "src": "/media/ashwork/thanks.mp4",
        "poster": "/media/ashwork/intro-poster.svg",
        "durationMs": 12000,
        "captionsSrc": "/media/ashwork/thanks.vtt",
        "videoProfile": {
          "purpose": [
            "thankyou"
          ],
          "pageEligibility": [
            "thankyou"
          ],
          "productLinks": [],
          "mood": [
            "warm"
          ],
          "antiRepetitionKey": "sena-thanks"
        }
      }
    ],
    "images": [
      {
        "id": "img_sena_portrait",
        "src": "/media/ashwork/sena-portrait.svg",
        "alt": "Sena at the wheel, hands cupping wet clay",
        "aspect": "4:5",
        "focalPoint": {
          "x": 0.5,
          "y": 0.4
        }
      },
      {
        "id": "img_ridge_1",
        "src": "/media/ashwork/ridge-tumbler.svg",
        "alt": "Ridge tumbler, ash glaze pooling at the base",
        "aspect": "1:1",
        "focalPoint": {
          "x": 0.5,
          "y": 0.55
        }
      },
      {
        "id": "img_bowl_1",
        "src": "/media/ashwork/ash-bowl.svg",
        "alt": "Serving bowl, matte oatmeal exterior",
        "aspect": "3:2",
        "focalPoint": {
          "x": 0.5,
          "y": 0.5
        }
      }
    ]
  },
  "products": [
    {
      "id": "p_ridge_tumbler",
      "title": "Ridge tumbler — ash glaze",
      "price": {
        "amount": 6800,
        "currency": "USD"
      },
      "description": "Thrown with a deliberate ridge you feel under the thumb. Ash glaze pools darker where it runs.",
      "mediaIds": [
        "img_ridge_1"
      ],
      "model3dId": null,
      "narrationClipTags": [
        "clip_tumbler"
      ],
      "inventory": {
        "status": "made-to-order",
        "qty": null
      },
      "badges": [
        "made-to-order"
      ]
    },
    {
      "id": "p_ash_bowl",
      "title": "Ash bowl — wide",
      "price": {
        "amount": 12400,
        "currency": "USD"
      },
      "description": "Big enough for a shared meal. Each fires a little differently in the ash.",
      "mediaIds": [
        "img_bowl_1"
      ],
      "model3dId": null,
      "narrationClipTags": [],
      "inventory": {
        "status": "in-stock",
        "qty": 3
      },
      "badges": [
        "one-of-a-kind"
      ]
    }
  ],
  "voiceovers": [
    {
      "id": "vo_glaze",
      "elementRef": {
        "kind": "product",
        "id": "p_ridge_tumbler",
        "field": null
      },
      "src": "/media/ashwork/vo_glaze.mp3",
      "durationMs": 9000,
      "transcript": null,
      "label": "Hear Sena on this glaze"
    }
  ],
  "blocks": [
    {
      "id": "b_hero",
      "type": "hero-video",
      "variant": "center-column",
      "order": 0,
      "props": {
        "showCraftLine": true
      },
      "bindings": {
        "clipTags": [
          "clip_intro"
        ],
        "imageIds": [],
        "productIds": [],
        "voiceoverIds": []
      }
    },
    {
      "id": "b_story",
      "type": "craft-story",
      "variant": "text-left-media-right",
      "order": 1,
      "props": {
        "heading": "Ash from my father’s workshop",
        "body": "The glaze on every piece starts as swept ash from the floor of my father’s carpentry shop in Lagos. I sieve it, wash it, and fire it to 1280°C — where it melts into a glass no two kilns repeat. What you hold carries two workshops and thirty years between them."
      },
      "bindings": {
        "imageIds": [
          "img_sena_portrait"
        ],
        "clipTags": [],
        "productIds": [],
        "voiceoverIds": []
      }
    },
    {
      "id": "b_proc",
      "type": "process-reel",
      "variant": "single-reel",
      "order": 2,
      "props": {
        "caption": "One tumbler, start to trim"
      },
      "bindings": {
        "clipTags": [
          "clip_wheel"
        ],
        "imageIds": [],
        "productIds": [],
        "voiceoverIds": []
      }
    },
    {
      "id": "b_show",
      "type": "product-showcase",
      "variant": "featured-single",
      "order": 3,
      "props": {
        "eyebrow": "Made to order"
      },
      "bindings": {
        "productIds": [
          "p_ridge_tumbler",
          "p_ash_bowl"
        ],
        "voiceoverIds": [
          "vo_glaze"
        ],
        "clipTags": [],
        "imageIds": []
      }
    },
    {
      "id": "b_quote",
      "type": "voice-quote",
      "variant": "text+waveform",
      "order": 4,
      "props": {
        "quote": "The wheel leaves a mark. I leave it in.",
        "attribution": "Sena, on the ridge",
        "blockGround": "a"
      },
      "bindings": {
        "voiceoverIds": [
          "vo_glaze"
        ],
        "clipTags": [],
        "imageIds": [],
        "productIds": []
      }
    },
    {
      "id": "b_space",
      "type": "atmosphere",
      "variant": "block-ground",
      "order": 5,
      "props": {
        "toneShift": "warm",
        "blockGround": "b"
      },
      "bindings": {
        "clipTags": [],
        "imageIds": [],
        "productIds": [],
        "voiceoverIds": []
      }
    },
    {
      "id": "b_trust",
      "type": "trust-badge",
      "variant": "expandable-detail",
      "order": 6,
      "props": {},
      "bindings": {
        "clipTags": [
          "clip_intro"
        ],
        "imageIds": [],
        "productIds": [],
        "voiceoverIds": []
      }
    },
    {
      "id": "b_cta",
      "type": "contact-cta",
      "variant": "footer-strip",
      "order": 7,
      "props": {
        "label": "Message Sena",
        "blockGround": "a"
      },
      "bindings": {
        "clipTags": [],
        "imageIds": [],
        "productIds": [],
        "voiceoverIds": []
      }
    }
  ],
  "meta": {
    "version": 3,
    "status": "published",
    "criticScore": 0.86,
    "approvedSections": [
      "b_hero",
      "b_story",
      "b_proc",
      "b_show",
      "b_quote",
      "b_space",
      "b_trust",
      "b_cta"
    ],
    "createdAt": "2026-07-10T14:02:00Z",
    "updatedAt": "2026-07-12T09:25:00Z"
  }
}$sena_cfg$::jsonb),
  ('22222222-2222-4222-8222-000000000002','11111111-1111-4111-8111-000000000002','noor','Tinctura','Indigo, madder, weld — vat-dyed by hand','She learned the vat from her grandmother, who kept one alive for thirty years.', true,
   $noor_cfg${
  "schemaVersion": "1.2",
  "storeId": "c2d9-tinctura",
  "maker": {
    "id": "mk_noor",
    "displayName": "Noor Haddad",
    "handle": "tinctura",
    "craft": "indigo-dyed linen, shibori folds",
    "location": "Amman & Rotterdam",
    "bio": "I keep a living indigo vat — it eats, sleeps, and some mornings refuses to dye. Every throw records the day the vat allowed it.",
    "avatarMediaId": "img_noor_portrait",
    "trust": {
      "realMaker": {
        "status": "pending",
        "verifiedAt": null,
        "voiceAnchorClipId": null
      },
      "aiTransparency": {
        "level": "ai-drafted",
        "disclosure": "KOL’s AI drafted this layout and derived the palette from Noor’s studio photos. Noor is reviewing each section; her words are her own.",
        "aiAssistedFields": [
          "layout",
          "palette",
          "copy-structure"
        ]
      }
    }
  },
  "theme": {
    "kind": "custom",
    "customPalette": {
      "mode": "dark",
      "roles": {
        "bg": "#10141F",
        "surface": "#1A2130",
        "ink": "#E9E4D6",
        "inkMuted": "#9AA3B8",
        "accent": "#E3A857",
        "accentInk": "#241705",
        "border": "#2A3245"
      }
    },
    "customPairing": {
      "displayFamily": "Fraunces",
      "textFamily": "General Sans",
      "scaleRatio": 1.28,
      "displayWeight": 650,
      "textWeight": 400
    },
    "motionPreset": "liquid",
    "radiusIdentity": "sharp",
    "density": "standard"
  },
  "media": {
    "clips": [
      {
        "id": "clip_vat",
        "kind": "video",
        "src": "/media/tinctura/vat.mp4",
        "poster": "/media/tinctura/vat-poster.svg",
        "durationMs": 36000,
        "captionsSrc": "/media/tinctura/vat.vtt",
        "videoProfile": {
          "purpose": [
            "intro",
            "craft-story"
          ],
          "pageEligibility": [
            "feed",
            "grown",
            "world"
          ],
          "productLinks": [],
          "mood": [
            "calm",
            "intimate"
          ],
          "antiRepetitionKey": "noor-vat"
        }
      }
    ],
    "images": [
      {
        "id": "img_noor_portrait",
        "src": "/media/tinctura/noor-portrait.svg",
        "alt": "Noor folding linen, indigo to the elbows",
        "aspect": "4:5",
        "focalPoint": {
          "x": 0.5,
          "y": 0.35
        }
      },
      {
        "id": "img_shibori_throw",
        "src": "/media/tinctura/shibori-throw.svg",
        "alt": "Shibori-fold throw, three dips deep",
        "aspect": "1:1",
        "focalPoint": {
          "x": 0.5,
          "y": 0.5
        }
      }
    ]
  },
  "products": [
    {
      "id": "p_shibori_throw",
      "title": "Shibori throw — deep indigo",
      "price": {
        "amount": 24500,
        "currency": "USD"
      },
      "description": "Folded, clamped, and dipped three times over two days. The white lines are where the cloth held its breath.",
      "mediaIds": [
        "img_shibori_throw"
      ],
      "model3dId": null,
      "narrationClipTags": [],
      "inventory": {
        "status": "in-stock",
        "qty": 2
      },
      "badges": [
        "one-of-a-kind"
      ]
    }
  ],
  "voiceovers": [
    {
      "id": "vo_vat",
      "elementRef": {
        "kind": "block",
        "id": "b_quote",
        "field": null
      },
      "src": "/media/tinctura/vo_vat.mp3",
      "durationMs": 11000,
      "transcript": "The vat is alive. You don't command it, you ask it.",
      "label": "Hear Noor on the living vat"
    }
  ],
  "blocks": [
    {
      "id": "b_hero",
      "type": "hero-video",
      "variant": "full-bleed",
      "order": 0,
      "props": {
        "showCraftLine": true
      },
      "bindings": {
        "clipTags": [
          "clip_vat"
        ],
        "imageIds": [],
        "productIds": [],
        "voiceoverIds": []
      }
    },
    {
      "id": "b_quote",
      "type": "voice-quote",
      "variant": "text+waveform",
      "order": 1,
      "props": {
        "quote": "You don’t command the vat. You ask it.",
        "attribution": "Noor, on dye day",
        "blockGround": "a"
      },
      "bindings": {
        "clipTags": [],
        "imageIds": [],
        "productIds": [],
        "voiceoverIds": [
          "vo_vat"
        ]
      }
    },
    {
      "id": "b_story",
      "type": "craft-story",
      "variant": "stacked-editorial",
      "order": 2,
      "props": {
        "heading": "A vat is a pet you can’t see",
        "body": "Indigo is fermentation, not pigment. My vat came from a Jordanian dye house that closed in 2019 — I carried a jar of its sludge to Rotterdam and fed it back to life. When the surface blooms copper, we dye. When it sulks, we wait."
      },
      "bindings": {
        "imageIds": [
          "img_noor_portrait"
        ],
        "clipTags": [],
        "productIds": [],
        "voiceoverIds": []
      }
    },
    {
      "id": "b_show",
      "type": "product-showcase",
      "variant": "featured-single",
      "order": 3,
      "props": {
        "eyebrow": "From the last dye day"
      },
      "bindings": {
        "productIds": [
          "p_shibori_throw"
        ],
        "voiceoverIds": [],
        "clipTags": [],
        "imageIds": []
      }
    },
    {
      "id": "b_cta",
      "type": "contact-cta",
      "variant": "footer-strip",
      "order": 4,
      "props": {
        "label": "Message Noor"
      },
      "bindings": {
        "clipTags": [],
        "imageIds": [],
        "productIds": [],
        "voiceoverIds": []
      }
    }
  ],
  "meta": {
    "version": 1,
    "status": "in_review",
    "criticScore": 0.81,
    "approvedSections": [
      "b_hero",
      "b_quote"
    ],
    "createdAt": "2026-07-18T10:12:00Z",
    "updatedAt": "2026-07-19T16:40:00Z"
  }
}$noor_cfg$::jsonb),
  ('22222222-2222-4222-8222-000000000003','11111111-1111-4111-8111-000000000003','tomas','Tomas — green woodwork','Ash split by hand, spoons and bowls','Green wood moves as it dries. That''s the material talking.', true,
   jsonb_build_object('schemaVersion','1.2','storeId','tomas','maker', jsonb_build_object('id','mk_tomas','displayName','Tomas','handle','tomas','craft','green woodwork','location','Vermont'),'media', jsonb_build_object('clips','[]'::jsonb,'images','[]'::jsonb,'audio','[]'::jsonb),'products','[]'::jsonb,'blocks','[]'::jsonb)),
  ('22222222-2222-4222-8222-000000000004','11111111-1111-4111-8111-000000000004','mira','Mira — copper','Hand-raised copper, small batch','A pan takes four days. Most of that is listening to the metal.', true,
   jsonb_build_object('schemaVersion','1.2','storeId','mira','maker', jsonb_build_object('id','mk_mira','displayName','Mira','handle','mira','craft','hand-raised copper','location','Asheville, NC'),'media', jsonb_build_object('clips','[]'::jsonb,'images','[]'::jsonb,'audio','[]'::jsonb),'products','[]'::jsonb,'blocks','[]'::jsonb)),
  ('22222222-2222-4222-8222-000000000005','11111111-1111-4111-8111-000000000005','elias','Elias — bookbinding','Hand-sewn bindings, marbled endpapers','Every book opens flat or it goes back on the bench.', true,
   jsonb_build_object('schemaVersion','1.2','storeId','elias','maker', jsonb_build_object('id','mk_elias','displayName','Elias','handle','elias','craft','bookbinding','location','Providence, RI'),'media', jsonb_build_object('clips','[]'::jsonb,'images','[]'::jsonb,'audio','[]'::jsonb),'products','[]'::jsonb,'blocks','[]'::jsonb))
on conflict (id) do update set
  handle = excluded.handle, name = excluded.name, craft = excluded.craft,
  bio = excluded.bio, published = excluded.published, config = excluded.config,
  updated_at = now();

-- Store versions: the snapshot + critic score + approved-section set the P9/P10
-- gates read. Values are the `meta` block of each fixture.
insert into public.store_versions (id, store_id, version, config, status, critic_score, approved_sections) values
  ('dddddddd-0000-4000-8000-000000000001','22222222-2222-4222-8222-000000000001', 3,
   (select config from public.stores where id = '22222222-2222-4222-8222-000000000001'),
   'published', 0.860,
   '["b_hero","b_story","b_proc","b_show","b_quote","b_space","b_trust","b_cta"]'::jsonb),
  ('dddddddd-0000-4000-8000-000000000002','22222222-2222-4222-8222-000000000002', 1,
   (select config from public.stores where id = '22222222-2222-4222-8222-000000000002'),
   'in_review', 0.810,
   '["b_hero","b_quote"]'::jsonb)
on conflict (id) do update set
  config = excluded.config, status = excluded.status,
  critic_score = excluded.critic_score,
  approved_sections = excluded.approved_sections, updated_at = now();


-- ============================================================================
-- 4 · MEDIA & VIDEOS
-- ----------------------------------------------------------------------------
-- ⚠ OQ-2 INVARIANT NOT SATISFIABLE FROM THE FIXTURES. ADR-0001 requires every
--   `config.media.clips[].id` to EQUAL a `videos.id`. The shipped fixtures use
--   symbolic ids (`clip_intro`, `clip_vat`, …), which are not UUIDs and cannot
--   equal one. The rows below therefore carry real UUIDs and the symbolic id is
--   noted in a comment on each. Either the fixtures must be rewritten with the
--   UUIDs below, or the invariant must be restated in terms of a lookup key.
--   Do not ship the video engine until one of those two happens.
--
-- Video files do not exist yet (real maker footage is D12). The poster paths do,
-- so the hero/reel surfaces render their poster-fallback state — which is the
-- honest state, not a broken one.
-- ============================================================================

insert into public.media (id, owner_id, store_id, kind, src, alt, aspect, focal_point) values
  ('55555555-0000-4000-8000-000000000001','11111111-1111-4111-8111-000000000001','22222222-2222-4222-8222-000000000001','image','/media/ashwork/sena-portrait.svg','Sena at the wheel, hands cupping wet clay','4:5','{"x":0.5,"y":0.4}'),
  ('55555555-0000-4000-8000-000000000002','11111111-1111-4111-8111-000000000001','22222222-2222-4222-8222-000000000001','image','/media/ashwork/ridge-tumbler.svg','Ridge tumbler, ash glaze pooling at the base','1:1','{"x":0.5,"y":0.55}'),
  ('55555555-0000-4000-8000-000000000003','11111111-1111-4111-8111-000000000001','22222222-2222-4222-8222-000000000001','image','/media/ashwork/ash-bowl.svg','Serving bowl, ash glaze pooled at the well','1:1','{"x":0.5,"y":0.5}'),
  ('55555555-0000-4000-8000-000000000004','11111111-1111-4111-8111-000000000001','22222222-2222-4222-8222-000000000001','audio','/media/ashwork/vo_glaze.mp3','Sena on the ash glaze',null,null),
  ('55555555-0000-4000-8000-000000000011','11111111-1111-4111-8111-000000000002','22222222-2222-4222-8222-000000000002','image','/media/tinctura/noor-portrait.svg','Noor folding linen, indigo to the elbows','4:5','{"x":0.5,"y":0.35}'),
  ('55555555-0000-4000-8000-000000000012','11111111-1111-4111-8111-000000000002','22222222-2222-4222-8222-000000000002','image','/media/tinctura/shibori-throw.svg','Shibori-fold throw, three dips deep','1:1','{"x":0.5,"y":0.5}'),
  ('55555555-0000-4000-8000-000000000013','11111111-1111-4111-8111-000000000002','22222222-2222-4222-8222-000000000002','audio','/media/tinctura/vo_vat.mp3','Noor on the living vat',null,null)
on conflict (id) do update set src = excluded.src, alt = excluded.alt;

insert into public.videos (id, owner_id, store_id, src, poster, duration_ms, captions_src) values
  -- config clip id: clip_intro
  ('44444444-0000-4000-8000-000000000001','11111111-1111-4111-8111-000000000001','22222222-2222-4222-8222-000000000001','/media/ashwork/intro.mp4','/media/ashwork/intro-poster.svg',41000,'/media/ashwork/intro.vtt'),
  -- config clip id: clip_wheel
  ('44444444-0000-4000-8000-000000000002','11111111-1111-4111-8111-000000000001','22222222-2222-4222-8222-000000000001','/media/ashwork/wheel.mp4','/media/ashwork/wheel-poster.svg',28000,'/media/ashwork/wheel.vtt'),
  -- config clip id: clip_tumbler
  ('44444444-0000-4000-8000-000000000003','11111111-1111-4111-8111-000000000001','22222222-2222-4222-8222-000000000001','/media/ashwork/tumbler.mp4','/media/ashwork/ridge-tumbler.svg',19000,null),
  -- config clip id: clip_thanks
  ('44444444-0000-4000-8000-000000000004','11111111-1111-4111-8111-000000000001','22222222-2222-4222-8222-000000000001','/media/ashwork/thanks.mp4','/media/ashwork/thanks-poster.svg',12000,null),
  -- config clip id: clip_vat
  ('44444444-0000-4000-8000-000000000011','11111111-1111-4111-8111-000000000002','22222222-2222-4222-8222-000000000002','/media/tinctura/vat.mp4','/media/tinctura/vat-poster.svg',36000,'/media/tinctura/vat.vtt'),
  -- feed depth for the three makers without a full world
  ('44444444-0000-4000-8000-000000000021','11111111-1111-4111-8111-000000000003','22222222-2222-4222-8222-000000000003','/media/tomas/split.mp4','/media/tomas/split-poster.svg',22000,null),
  ('44444444-0000-4000-8000-000000000031','11111111-1111-4111-8111-000000000004','22222222-2222-4222-8222-000000000004','/media/mira/pan.mp4','/media/mira/pan-poster.svg',26000,null),
  ('44444444-0000-4000-8000-000000000041','11111111-1111-4111-8111-000000000005','22222222-2222-4222-8222-000000000005','/media/elias/endpapers.mp4','/media/elias/endpapers-poster.svg',18000,null),
  ('44444444-0000-4000-8000-000000000042','11111111-1111-4111-8111-000000000005','22222222-2222-4222-8222-000000000005','/media/elias/spine.mp4','/media/elias/spine-poster.svg',31000,null)
on conflict (id) do update set src = excluded.src, poster = excluded.poster, duration_ms = excluded.duration_ms;

-- The engine's selection signals. `page_eligibility` matters: no `thankyou`
-- clip is ever feed-eligible (a thank-you film shown to a stranger in the feed
-- is the exact tonal failure the concept-lock rejects).
insert into public.video_profiles (id, video_id, purpose, page_eligibility, product_links, mood, anti_repetition_key) values
  ('ffffffff-0000-4000-8000-000000000001','44444444-0000-4000-8000-000000000001','{intro}','{feed,grown,world}','{}','{warm,intimate}','sena-intro'),
  ('ffffffff-0000-4000-8000-000000000002','44444444-0000-4000-8000-000000000002','{process}','{world}','{}','{calm}','sena-wheel'),
  ('ffffffff-0000-4000-8000-000000000003','44444444-0000-4000-8000-000000000003','{product-narration}','{world,product}','{33333333-0000-4000-8000-000000000002}','{calm,intimate}','sena-tumbler'),
  ('ffffffff-0000-4000-8000-000000000004','44444444-0000-4000-8000-000000000004','{thankyou}','{thankyou}','{}','{warm}','sena-thanks'),
  ('ffffffff-0000-4000-8000-000000000011','44444444-0000-4000-8000-000000000011','{intro,craft-story}','{feed,grown,world}','{33333333-0000-4000-8000-000000000001}','{calm,intimate}','noor-vat'),
  ('ffffffff-0000-4000-8000-000000000021','44444444-0000-4000-8000-000000000021','{process}','{feed,world}','{}','{calm}','tomas-split'),
  ('ffffffff-0000-4000-8000-000000000031','44444444-0000-4000-8000-000000000031','{process}','{feed,world}','{}','{warm}','mira-pan'),
  ('ffffffff-0000-4000-8000-000000000041','44444444-0000-4000-8000-000000000041','{atmosphere}','{feed,world}','{}','{calm}','elias-endpapers'),
  ('ffffffff-0000-4000-8000-000000000042','44444444-0000-4000-8000-000000000042','{process}','{feed,world}','{}','{intimate}','elias-spine')
on conflict (id) do update set
  purpose = excluded.purpose, page_eligibility = excluded.page_eligibility,
  product_links = excluded.product_links, mood = excluded.mood,
  anti_repetition_key = excluded.anti_repetition_key;


-- ============================================================================
-- 5 · PRODUCTS
-- ----------------------------------------------------------------------------
-- Money is integer MINOR units (cents) + currency, per store-config §2.4.
-- Prices and inventory come from `db.ts` — the columns are what `create_order()`
-- reads, so they are the commerce truth. See conflict note 2 in the header.
--
-- `config_id` (migration 0003 — apply it before this file) is the store-config
-- SYMBOLIC product id the rendered world links to (`/m/[slug]/p/p_ridge_tumbler`).
-- It equals `config.products[].id` in the D4 fixture, so `getProduct` resolves
-- the same id a world emits (closes the OQ-2 product id-space gap). The
-- commission quilt has no world presence, so its `config_id` is NULL.
-- ============================================================================

insert into public.products
  (id, store_id, config_id, title, description, materials, price_amount, currency, inventory_status, inventory_qty, badges) values
  ('33333333-0000-4000-8000-000000000001','22222222-2222-4222-8222-000000000002','p_shibori_throw',
   'Shibori throw — deep indigo',
   'Vat-dyed linen throw, bound and dipped nine times. The unevenness you can see in the film is the point — no two skeins leave the same.',
   'European flax linen; natural indigo, madder root',
   24500,'USD','made-to-order', null, '{one-of-a-kind}'),
  ('33333333-0000-4000-8000-000000000002','22222222-2222-4222-8222-000000000001','p_ridge_tumbler',
   'Ridge tumbler — ash glaze',
   'Wheel-thrown stoneware tumbler with the ridge line left proud. Ash glaze breaks amber where the flame hits.',
   'Local stoneware clay; hardwood-ash glaze',
   6800,'USD','in-stock', 7, '{}'),
  ('33333333-0000-4000-8000-000000000003','22222222-2222-4222-8222-000000000001','p_ash_bowl',
   'Ash bowl — wide',
   'Wide serving bowl, ash glaze pooled at the well.',
   'Local stoneware; hardwood-ash glaze',
   12400,'USD','in-stock', 3, '{}'),
  ('33333333-0000-4000-8000-000000000004','22222222-2222-4222-8222-000000000002', null,
   'Commissioned indigo quilt (co-created)',
   'Full co-creation piece — brief, drafts, and approval before the vat opens.',
   'Linen top, cotton batting, natural indigo',
   88000,'USD','made-to-order', null, '{one-of-a-kind,made-to-order}')
on conflict (id) do update set
  config_id = excluded.config_id,
  title = excluded.title, description = excluded.description,
  materials = excluded.materials, price_amount = excluded.price_amount,
  currency = excluded.currency, inventory_status = excluded.inventory_status,
  inventory_qty = excluded.inventory_qty, badges = excluded.badges,
  updated_at = now();

insert into public.product_categories (product_id, category_id) values
  ('33333333-0000-4000-8000-000000000001','0a0a0a0a-0000-4000-8000-000000000002'),
  ('33333333-0000-4000-8000-000000000001','0a0a0a0a-0000-4000-8000-000000000012'),
  ('33333333-0000-4000-8000-000000000002','0a0a0a0a-0000-4000-8000-000000000001'),
  ('33333333-0000-4000-8000-000000000002','0a0a0a0a-0000-4000-8000-000000000011'),
  ('33333333-0000-4000-8000-000000000003','0a0a0a0a-0000-4000-8000-000000000001'),
  ('33333333-0000-4000-8000-000000000003','0a0a0a0a-0000-4000-8000-000000000011'),
  ('33333333-0000-4000-8000-000000000004','0a0a0a0a-0000-4000-8000-000000000002')
on conflict (product_id, category_id) do nothing;


-- ============================================================================
-- 6 · P14 · EXACTLY WHAT TO EXPECT (all 11 spec fields, every product)
-- ----------------------------------------------------------------------------
-- P14 is a REQUIRED standard: every product carries all eleven fields. The
-- eleventh, `first_use`, is the column added in 0001 that the plan file omitted.
-- ============================================================================

insert into public.product_specs
  (id, product_id, dimensions, materials, texture, handmade_variation, production_time,
   shipping, care, repairs, returns, customization_limits, first_use) values
  ('66666666-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',
   '130 × 180 cm, ±3 cm — cut and hemmed by hand',
   '100% linen, natural indigo — no synthetic fixers',
   'Dry, weighty hand; softens with every wash',
   'Pattern spacing varies; yours will not match the photo exactly',
   'Made to order — about 3 weeks before shipping',
   'Tracked, 5–8 days EU/US; ships in paper, no plastic',
   'Cold hand-wash, dry flat, out of direct sun',
   'I re-dye & mend for free within 2 years',
   '14 days if unwashed; made-to-order, so please ask first',
   'Size & indigo depth, yes; other dyes, ask',
   'Will release loose indigo once — wash alone the first time'),
  ('66666666-0000-4000-8000-000000000002','33333333-0000-4000-8000-000000000002',
   '9 cm ⌀ × 11 cm, ~330 ml — each within ±5 mm',
   'Stoneware, food-safe ash glaze (lead-free)',
   'Satin glaze over visible throwing ridge',
   'Glaze break differs on every piece',
   'In stock — ships in 2–3 days',
   'Double-boxed, tracked, US 3–5 days',
   'Dishwasher fine; avoid thermal shock',
   'Chips happen — kintsugi referral, at cost',
   '30 days, any reason',
   'Sets of 4+ can be matched on request',
   'None — use it tonight'),
  ('66666666-0000-4000-8000-000000000003','33333333-0000-4000-8000-000000000003',
   '26 cm ⌀ × 9 cm',
   'Stoneware, food-safe glaze',
   'Glassy well, dry rim',
   'Pooling pattern unique per bowl',
   'In stock — 2–3 days',
   'Double-boxed, tracked',
   'Dishwasher fine',
   'Kintsugi referral at cost',
   '30 days',
   'Glaze depth on request for sets',
   'None'),
  ('66666666-0000-4000-8000-000000000004','33333333-0000-4000-8000-000000000004',
   'Set in the brief — up to 220 × 240 cm',
   'Linen + cotton, natural dye only',
   'Quilted, weighty',
   'Every panel unique',
   '~8 weeks after draft approval',
   'Insured, tracked',
   'Cold hand-wash',
   'Lifetime mending',
   'Deposit non-refundable after approval; balance refundable pre-ship',
   'Indigo family only',
   'Wash alone once')
on conflict (id) do update set
  dimensions = excluded.dimensions, materials = excluded.materials,
  texture = excluded.texture, handmade_variation = excluded.handmade_variation,
  production_time = excluded.production_time, shipping = excluded.shipping,
  care = excluded.care, repairs = excluded.repairs, returns = excluded.returns,
  customization_limits = excluded.customization_limits,
  first_use = excluded.first_use, updated_at = now();


-- ============================================================================
-- 7 · P13 · PROOF OF PRODUCT (maker-DECLARED provenance)
-- ----------------------------------------------------------------------------
-- D7: this is declared and shown, not third-party physically verified. The copy
-- must never imply otherwise.
-- ============================================================================

insert into public.product_provenance
  (id, product_id, maker_role, materials, process, production_location, partners, process_media_ids) values
  ('77777777-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',
   'Dyed, bound, and finished by Noor — every step',
   'European flax linen; natural indigo, madder root',
   'Bound-resist (shibori), nine dips, air-oxidised between each',
   'Studio in Lisbon; indigo from a family supplier in Marrakech',
   'Loom-woven blanks from a two-person mill in Guimarães',
   '{44444444-0000-4000-8000-000000000011}'),
  ('77777777-0000-4000-8000-000000000002','33333333-0000-4000-8000-000000000002',
   'Thrown, glazed, and fired by Sena',
   'Local stoneware clay; hardwood-ash glaze',
   'Wheel-thrown, once-fired to cone 10 in a gas kiln',
   'Barn studio, Hudson Valley NY',
   'None — single pair of hands',
   '{44444444-0000-4000-8000-000000000002,44444444-0000-4000-8000-000000000003}'),
  ('77777777-0000-4000-8000-000000000003','33333333-0000-4000-8000-000000000003',
   'Thrown, glazed, and fired by Sena',
   'Local stoneware; hardwood-ash glaze',
   'Wheel-thrown, cone 10',
   'Hudson Valley, NY',
   'None',
   '{44444444-0000-4000-8000-000000000002}'),
  ('77777777-0000-4000-8000-000000000004','33333333-0000-4000-8000-000000000004',
   'Designed with the buyer; dyed and quilted by Noor',
   'Linen top, cotton batting, natural indigo',
   'Shibori panels, hand-quilted',
   'Lisbon',
   'None',
   '{44444444-0000-4000-8000-000000000011}')
on conflict (id) do update set
  maker_role = excluded.maker_role, materials = excluded.materials,
  process = excluded.process, production_location = excluded.production_location,
  partners = excluded.partners, process_media_ids = excluded.process_media_ids,
  updated_at = now();


-- ============================================================================
-- 8 · VOICEOVERS (P12 — the maker's real recorded voice, never cloned, D11)
-- ============================================================================

insert into public.voiceovers
  (id, store_id, element_kind, element_id, element_field, media_id, src, duration_ms, transcript, label) values
  ('eeeeeeee-0000-4000-8000-000000000001','22222222-2222-4222-8222-000000000001','product','p_ridge_tumbler', null,
   '55555555-0000-4000-8000-000000000004','/media/ashwork/vo_glaze.mp3', 9000, null, 'Hear Sena on this glaze'),
  ('eeeeeeee-0000-4000-8000-000000000002','22222222-2222-4222-8222-000000000002','block','b_quote', null,
   '55555555-0000-4000-8000-000000000013','/media/tinctura/vo_vat.mp3', 11000,
   'The vat is alive. You don''t command it, you ask it.', 'Hear Noor on the living vat')
on conflict (id) do update set
  src = excluded.src, duration_ms = excluded.duration_ms,
  transcript = excluded.transcript, label = excluded.label;


-- ============================================================================
-- 9 · TRUST · VERIFICATIONS & BADGES
-- ----------------------------------------------------------------------------
-- Resolution to 'verified' is a service-role act — the seed does it directly,
-- exactly as the verification resolver will. Mira stays PENDING on purpose: the
-- prototype exercises the honest unverified state, and D7 forbids papering over
-- it. See conflict note 3 for Noor.
-- ============================================================================

insert into public.verifications (id, store_id, maker_id, voice_anchor_clip_id, status, verified_at) values
  ('bbbbbbbb-0000-4000-8000-000000000001','22222222-2222-4222-8222-000000000001','11111111-1111-4111-8111-000000000001','44444444-0000-4000-8000-000000000001','verified', now() - interval '9 days'),
  ('bbbbbbbb-0000-4000-8000-000000000002','22222222-2222-4222-8222-000000000002','11111111-1111-4111-8111-000000000002','44444444-0000-4000-8000-000000000011','verified', now() - interval '4 days'),
  ('bbbbbbbb-0000-4000-8000-000000000003','22222222-2222-4222-8222-000000000003','11111111-1111-4111-8111-000000000003','44444444-0000-4000-8000-000000000021','verified', now() - interval '20 days'),
  ('bbbbbbbb-0000-4000-8000-000000000004','22222222-2222-4222-8222-000000000004','11111111-1111-4111-8111-000000000004', null,                                   'pending', null),
  ('bbbbbbbb-0000-4000-8000-000000000005','22222222-2222-4222-8222-000000000005','11111111-1111-4111-8111-000000000005','44444444-0000-4000-8000-000000000041','verified', now() - interval '31 days')
on conflict (id) do update set
  status = excluded.status, verified_at = excluded.verified_at,
  voice_anchor_clip_id = excluded.voice_anchor_clip_id, updated_at = now();

-- Real-Maker badges. `badges_real_maker_guard` fires on every one of these and
-- will reject any row whose verification is not 'verified' for the same store —
-- which is why Mira has no real-maker badge below rather than a suppressed one.
insert into public.badges (id, store_id, kind, verification_id) values
  ('cccccccc-0000-4000-8000-000000000001','22222222-2222-4222-8222-000000000001','real-maker','bbbbbbbb-0000-4000-8000-000000000001'),
  ('cccccccc-0000-4000-8000-000000000002','22222222-2222-4222-8222-000000000002','real-maker','bbbbbbbb-0000-4000-8000-000000000002'),
  ('cccccccc-0000-4000-8000-000000000003','22222222-2222-4222-8222-000000000003','real-maker','bbbbbbbb-0000-4000-8000-000000000003'),
  ('cccccccc-0000-4000-8000-000000000005','22222222-2222-4222-8222-000000000005','real-maker','bbbbbbbb-0000-4000-8000-000000000005')
on conflict (id) do update set verification_id = excluded.verification_id, updated_at = now();

-- AI-transparency badges: the honest disclosure of where the AI helped, taken
-- verbatim from each fixture's `maker.trust.aiTransparency`.
insert into public.badges (id, store_id, kind, transparency_level, disclosure, ai_assisted_fields) values
  ('cccccccc-0000-4000-8000-000000000011','22222222-2222-4222-8222-000000000001','ai-transparency','ai-assisted',
   'Sena wrote every word. KOL''s AI suggested the layout and picked the palette; Sena approved each section.',
   '{layout,palette}'),
  ('cccccccc-0000-4000-8000-000000000012','22222222-2222-4222-8222-000000000002','ai-transparency','ai-drafted',
   'KOL''s AI drafted this layout and derived the palette from Noor''s studio photos. Noor is reviewing each section; her words are her own.',
   '{layout,palette,copy-structure}')
on conflict (id) do update set
  transparency_level = excluded.transparency_level,
  disclosure = excluded.disclosure,
  ai_assisted_fields = excluded.ai_assisted_fields, updated_at = now();


-- ============================================================================
-- 10 · ORDERS
-- ----------------------------------------------------------------------------
-- Seeded directly (RLS bypass), because there is deliberately no client write
-- path to these tables. Reviews below need real line items to be `verified` —
-- `reviews.verified` is a GENERATED column, so it cannot be faked; the purchase
-- has to exist.
-- ============================================================================

insert into public.orders (id, buyer_id, store_id, status, subtotal_amount, currency, created_at) values
  ('88880000-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000a','22222222-2222-4222-8222-000000000002','fulfilled', 24500,'USD', now() - interval '21 days'),
  ('88880000-0000-4000-8000-000000000002','11111111-1111-4111-8111-00000000000b','22222222-2222-4222-8222-000000000001','fulfilled',  6800,'USD', now() - interval '35 days'),
  -- the prototype's order #1041: ridge tumblers ×2 for the demo buyer
  ('88880000-0000-4000-8000-000000000003','11111111-1111-4111-8111-00000000000e','22222222-2222-4222-8222-000000000001','fulfilled', 13600,'USD', now() - interval '7 days')
on conflict (id) do update set
  status = excluded.status, subtotal_amount = excluded.subtotal_amount,
  currency = excluded.currency, updated_at = now();

insert into public.order_items (id, order_id, product_id, quantity, unit_price_amount, currency, variation) values
  ('99990000-0000-4000-8000-000000000001','88880000-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',1,24500,'USD','130 × 180, deep indigo'),
  ('99990000-0000-4000-8000-000000000002','88880000-0000-4000-8000-000000000002','33333333-0000-4000-8000-000000000002',1, 6800,'USD','Single, amber break'),
  ('99990000-0000-4000-8000-000000000003','88880000-0000-4000-8000-000000000003','33333333-0000-4000-8000-000000000002',2, 6800,'USD',null)
on conflict (id) do update set
  quantity = excluded.quantity, unit_price_amount = excluded.unit_price_amount,
  variation = excluded.variation;


-- ============================================================================
-- 11 · REVIEWS (D16-5 — verified purchase, variation, expectation accuracy)
-- ============================================================================

insert into public.reviews
  (id, product_id, buyer_id, order_item_id, rating, body, variation, expectation_accuracy, maker_response, created_at) values
  ('aaaa0000-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000a','99990000-0000-4000-8000-000000000001',
   5,'The unevenness I saw in her video is exactly what showed up on my couch — more textured in person and I love that.',
   '130 × 180, deep indigo', 5,
   'This made my week — that batch fought me and won. Enjoy it. — Noor', now() - interval '14 days'),
  ('aaaa0000-0000-4000-8000-000000000002','33333333-0000-4000-8000-000000000002','11111111-1111-4111-8111-00000000000b','99990000-0000-4000-8000-000000000002',
   5,'Slightly darker than the film showed, which she warns you about. The ridge really is where your thumb lands.',
   'Single, amber break', 4, null, now() - interval '30 days')
on conflict (id) do update set
  rating = excluded.rating, body = excluded.body, variation = excluded.variation,
  expectation_accuracy = excluded.expectation_accuracy,
  maker_response = excluded.maker_response, updated_at = now();

-- Priya's review has a photo in the prototype (`hasPhoto: true`).
insert into public.review_media (id, review_id, kind, src, alt) values
  ('aaaa1111-0000-4000-8000-000000000001','aaaa0000-0000-4000-8000-000000000001','image',
   '/media/reviews/shibori-on-couch.svg','The indigo throw over a pale linen sofa, folded at the arm')
on conflict (id) do update set src = excluded.src, alt = excluded.alt;


-- ============================================================================
-- 12 · PUBLIC Q&A (B12 — separate from private threads, OQ-5)
-- ============================================================================

insert into public.questions (id, product_id, store_id, buyer_id, body, created_at) values
  ('cafe0000-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001','22222222-2222-4222-8222-000000000002','11111111-1111-4111-8111-00000000000b',
   'Does the indigo rub off on light sofas?', now() - interval '11 days'),
  ('cafe0000-0000-4000-8000-000000000002','33333333-0000-4000-8000-000000000001','22222222-2222-4222-8222-000000000002','11111111-1111-4111-8111-00000000000c',
   'Can you make it a touch bigger for a queen bed?', now() - interval '6 days')
on conflict (id) do update set body = excluded.body;

insert into public.answers (id, question_id, maker_id, kind, body, media_id, created_at) values
  ('cafe1111-0000-4000-8000-000000000001','cafe0000-0000-4000-8000-000000000001','11111111-1111-4111-8111-000000000002','text',
   'A little the first week, like new denim. After the first wash it''s set. I''d keep it off cream linen until then.',
   null, now() - interval '10 days'),
  -- the audio answer (0:24) — the maker chose to speak rather than type
  ('cafe1111-0000-4000-8000-000000000002','cafe0000-0000-4000-8000-000000000002','11111111-1111-4111-8111-000000000002','audio',
   'Yes — up to 150 × 200. Listen, I''ll tell you why I''d size it this way, it''s easier to hear than read.',
   '55555555-0000-4000-8000-000000000013', now() - interval '5 days')
on conflict (id) do update set body = excluded.body, kind = excluded.kind, media_id = excluded.media_id;


-- ============================================================================
-- 13 · RELATIONSHIP SIGNALS
-- ----------------------------------------------------------------------------
-- Follows drive the "Because you follow Sena" feed reasons in the prototype and
-- are the membership signal `join_community()` checks in 0002.
-- ============================================================================

insert into public.follows (id, buyer_id, maker_id) values
  ('beef0000-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000e','11111111-1111-4111-8111-000000000001'),
  ('beef0000-0000-4000-8000-000000000002','11111111-1111-4111-8111-00000000000e','11111111-1111-4111-8111-000000000002'),
  ('beef0000-0000-4000-8000-000000000003','11111111-1111-4111-8111-00000000000a','11111111-1111-4111-8111-000000000002'),
  ('beef0000-0000-4000-8000-000000000004','11111111-1111-4111-8111-00000000000b','11111111-1111-4111-8111-000000000001'),
  ('beef0000-0000-4000-8000-000000000005','11111111-1111-4111-8111-00000000000d','11111111-1111-4111-8111-000000000001')
on conflict (buyer_id, maker_id) do nothing;

insert into public.saves (id, buyer_id, subject_type, subject_id) values
  ('5a1e0000-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000e','product','33333333-0000-4000-8000-000000000001'),
  ('5a1e0000-0000-4000-8000-000000000002','11111111-1111-4111-8111-00000000000e','product','33333333-0000-4000-8000-000000000002'),
  ('5a1e0000-0000-4000-8000-000000000003','11111111-1111-4111-8111-00000000000e','store',  '22222222-2222-4222-8222-000000000004')
on conflict (buyer_id, subject_type, subject_id) do nothing;

-- Emitted by the engine in production; seeded here so ranking has something to
-- rank on day one. Weights stay inside the 0–100 CHECK.
insert into public.buyer_signals (id, buyer_id, subject_type, subject_id, signal_type, weight) values
  ('516a0000-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000e','maker',  '11111111-1111-4111-8111-000000000001','follow',   5.0),
  ('516a0000-0000-4000-8000-000000000002','11111111-1111-4111-8111-00000000000e','maker',  '11111111-1111-4111-8111-000000000002','follow',   5.0),
  ('516a0000-0000-4000-8000-000000000003','11111111-1111-4111-8111-00000000000e','product','33333333-0000-4000-8000-000000000002','purchase',10.0),
  ('516a0000-0000-4000-8000-000000000004','11111111-1111-4111-8111-00000000000e','product','33333333-0000-4000-8000-000000000001','save',     3.0),
  ('516a0000-0000-4000-8000-000000000005','11111111-1111-4111-8111-00000000000b','product','33333333-0000-4000-8000-000000000001','question', 4.0),
  ('516a0000-0000-4000-8000-000000000006','11111111-1111-4111-8111-00000000000e','store',  '22222222-2222-4222-8222-000000000005','visit',    1.0)
on conflict (id) do nothing;


-- ============================================================================
-- 14 · PRIVATE MESSAGING & AN IN-FLIGHT COMMISSION (P15 / B14)
-- ----------------------------------------------------------------------------
-- Mirrors the prototype's two inbox threads. `guard_thread` and
-- `guard_commission` both fire on these inserts, so the seed doubles as a live
-- proof that the counterparty rules accept legitimate data.
-- ============================================================================

insert into public.threads (id, buyer_id, maker_id, store_id, subject, created_at) values
  ('7ea70000-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000e','11111111-1111-4111-8111-000000000002','22222222-2222-4222-8222-000000000002','Indigo quilt — draft v3', now() - interval '9 days'),
  ('7ea70000-0000-4000-8000-000000000002','11111111-1111-4111-8111-00000000000e','11111111-1111-4111-8111-000000000001','22222222-2222-4222-8222-000000000001','Order #1041 — ridge tumblers ×2', now() - interval '6 days')
on conflict (id) do update set subject = excluded.subject, updated_at = now();

insert into public.commissions (id, buyer_id, maker_id, store_id, thread_id, brief, status, created_at) values
  ('c0117000-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000e','11111111-1111-4111-8111-000000000002','22222222-2222-4222-8222-000000000002','7ea70000-0000-4000-8000-000000000001',
   jsonb_build_object(
     'recipient','for our own bed',
     'occasion','tenth anniversary',
     'meaning','the colour of the sea at Essaouira at dusk',
     'preferences', jsonb_build_object('size','220 × 240 cm','palette','indigo family only')),
   'drafting', now() - interval '9 days')
on conflict (id) do update set brief = excluded.brief, status = excluded.status, updated_at = now();

update public.threads
  set commission_id = 'c0117000-0000-4000-8000-000000000001'
  where id = '7ea70000-0000-4000-8000-000000000001';

insert into public.messages (id, thread_id, sender_id, kind, body, created_at) values
  ('4e550000-0000-4000-8000-000000000001','7ea70000-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000e','text',
   'The second panel feels right. Could the border pull from the same dark dip?', now() - interval '4 days'),
  ('4e550000-0000-4000-8000-000000000002','7ea70000-0000-4000-8000-000000000001','11111111-1111-4111-8111-000000000002','audio',
   'Voice note — why the border wants to stay lighter (0:41)', now() - interval '4 days'),
  ('4e550000-0000-4000-8000-000000000003','7ea70000-0000-4000-8000-000000000001','11111111-1111-4111-8111-000000000002','text',
   'Draft v3 — border kept light, corners deepened', now() - interval '3 days'),
  ('4e550000-0000-4000-8000-000000000004','7ea70000-0000-4000-8000-000000000002','11111111-1111-4111-8111-000000000001','text',
   'Both tumblers came out of the kiln this morning — the amber break is strong on yours. Shipping tomorrow.', now() - interval '5 days')
on conflict (id) do update set body = excluded.body, kind = excluded.kind;

insert into public.commission_drafts (id, commission_id, version, content, note, status, created_at) values
  ('d4a70000-0000-4000-8000-000000000001','c0117000-0000-4000-8000-000000000001',1,
   jsonb_build_object('summary','First pass — three panels, even border'), 'Opening idea', 'proposed', now() - interval '8 days'),
  ('d4a70000-0000-4000-8000-000000000002','c0117000-0000-4000-8000-000000000001',2,
   jsonb_build_object('summary','Second panel deepened'), 'After your note about the middle', 'revised', now() - interval '6 days'),
  ('d4a70000-0000-4000-8000-000000000003','c0117000-0000-4000-8000-000000000001',3,
   jsonb_build_object('summary','Border kept light, corners deepened'), 'Draft v3', 'revised', now() - interval '3 days')
on conflict (id) do update set content = excluded.content, note = excluded.note, status = excluded.status;


-- ============================================================================
-- 15 · INTERVIEW (S2/D8 — Sena's capture, private to her)
-- ============================================================================

insert into public.interviews (id, maker_id, store_id, mode, status, created_at) values
  ('1a7e0000-0000-4000-8000-000000000001','11111111-1111-4111-8111-000000000001','22222222-2222-4222-8222-000000000001','film','complete', now() - interval '14 days')
on conflict (id) do update set status = excluded.status, updated_at = now();

insert into public.interview_answers (id, interview_id, beat_key, question, answer_text, ordinal) values
  ('1a7e1111-0000-4000-8000-000000000001','1a7e0000-0000-4000-8000-000000000001','story-origin','How did you start?','My father kept a workshop. The ash in my glazes is still his.',1),
  ('1a7e1111-0000-4000-8000-000000000002','1a7e0000-0000-4000-8000-000000000001','craft','What does the work ask of you?','Twelve years and one wheel. You learn the clay before it learns you.',2),
  ('1a7e1111-0000-4000-8000-000000000003','1a7e0000-0000-4000-8000-000000000001','workshop','Where do you work?','A barn in the Hudson Valley. Cold in February, perfect in October.',3),
  ('1a7e1111-0000-4000-8000-000000000004','1a7e0000-0000-4000-8000-000000000001','values','What would you never do?','Fire someone else''s pot and call it mine.',4),
  ('1a7e1111-0000-4000-8000-000000000005','1a7e0000-0000-4000-8000-000000000001','product-stories','Tell me about the ridge.','The ridge is where your thumb lands. That''s not an accident.',5)
on conflict (id) do update set answer_text = excluded.answer_text, ordinal = excluded.ordinal;


-- ============================================================================
-- 16 · CART (one active cart for the demo buyer)
-- ============================================================================

insert into public.carts (id, buyer_id, status) values
  ('ca270000-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000e','active')
on conflict (id) do nothing;

commit;


-- ============================================================================
-- 17 · 0002 CONTENT — notifications, collections, community
-- ----------------------------------------------------------------------------
-- Separate transaction so this file still succeeds when 0002 has NOT been
-- applied. If the tables are absent the whole block is skipped with a notice.
-- ============================================================================

do $$
begin
  -- Same trusted-server declaration as above; this block is its own transaction.
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);

  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname = 'public' and c.relname = 'notifications') then
    raise notice 'seed: 0002 not applied — skipping notifications/collections/community content.';
    return;
  end if;

  -- --- B16 notifications (service-role emission; body_key, never free text) --
  insert into public.notifications (id, recipient_id, type, actor_maker_id, subject_type, subject_id, body_key, body_vars, read_at, created_at) values
    ('0071f000-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000e','maker_new_product','11111111-1111-4111-8111-000000000001','store','22222222-2222-4222-8222-000000000001','maker_new_batch', '{"count":1}', null, now() - interval '2 hours'),
    ('0071f000-0000-4000-8000-000000000002','11111111-1111-4111-8111-00000000000e','commission_draft_new_version','11111111-1111-4111-8111-000000000002','commission','c0117000-0000-4000-8000-000000000001','commission_draft_new_version','{"version":3}', null, now() - interval '1 day'),
    ('0071f000-0000-4000-8000-000000000003','11111111-1111-4111-8111-00000000000e','question_answered','11111111-1111-4111-8111-000000000002','answer','cafe1111-0000-4000-8000-000000000001','question_answered','{"product_title":"Shibori throw — deep indigo"}', now() - interval '1 day', now() - interval '2 days'),
    ('0071f000-0000-4000-8000-000000000004','11111111-1111-4111-8111-00000000000e','order_status_fulfilled','11111111-1111-4111-8111-000000000001','order','88880000-0000-4000-8000-000000000003','order_shipped','{"order_last4":"1041"}', now() - interval '2 days', now() - interval '3 days')
  on conflict (id) do update set read_at = excluded.read_at, body_vars = excluded.body_vars;

  -- --- B17 collections. Slugs mirror the prototype's readable stand-ins; the
  -- --- real ones come from generate_collection_slug() (122 bits). These two are
  -- --- SEED-ONLY and must never be treated as a slug format example.
  insert into public.collections (id, owner_id, title, visibility, slug) values
    ('c0110000-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000e','Slow textiles','public',  'c9f3k2m8seed0000000000000000000a'),
    ('c0110000-0000-4000-8000-000000000002','11111111-1111-4111-8111-00000000000e','Kitchen, eventually','private','c2b7d0x1seed0000000000000000000b')
  on conflict (id) do update set title = excluded.title, visibility = excluded.visibility, updated_at = now();

  insert into public.collection_items (id, collection_id, subject_type, subject_id, position) values
    ('c0111111-0000-4000-8000-000000000001','c0110000-0000-4000-8000-000000000001','product','33333333-0000-4000-8000-000000000001',0),
    ('c0111111-0000-4000-8000-000000000002','c0110000-0000-4000-8000-000000000001','maker',  '11111111-1111-4111-8111-000000000002',1),
    ('c0111111-0000-4000-8000-000000000003','c0110000-0000-4000-8000-000000000001','product','33333333-0000-4000-8000-000000000004',2),
    ('c0111111-0000-4000-8000-000000000011','c0110000-0000-4000-8000-000000000002','product','33333333-0000-4000-8000-000000000002',0),
    ('c0111111-0000-4000-8000-000000000012','c0110000-0000-4000-8000-000000000002','product','33333333-0000-4000-8000-000000000003',1),
    ('c0111111-0000-4000-8000-000000000013','c0110000-0000-4000-8000-000000000002','maker',  '11111111-1111-4111-8111-000000000004',2)
  on conflict (id) do update set position = excluded.position;

  -- --- B15/D17 community. Sena's is broadcast (open to any signed-in buyer);
  -- --- Noor's is private and cold-start empty — a designed empty state, not a
  -- --- hidden one.
  insert into public.communities (id, maker_id, store_id, mode, name, description) values
    ('c0aa0000-0000-4000-8000-000000000001','11111111-1111-4111-8111-000000000001','22222222-2222-4222-8222-000000000001','broadcast','Ashwork','Glaze tests, kiln days, and first pick of the batch.'),
    ('c0aa0000-0000-4000-8000-000000000002','11111111-1111-4111-8111-000000000002','22222222-2222-4222-8222-000000000002','private','Tinctura vat days','The full dye-day cut, for people who follow the vat.')
  on conflict (id) do update set mode = excluded.mode, name = excluded.name, description = excluded.description, updated_at = now();

  insert into public.community_members (id, community_id, buyer_id, role) values
    ('c0bb0000-0000-4000-8000-000000000001','c0aa0000-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000a','member'),
    ('c0bb0000-0000-4000-8000-000000000002','c0aa0000-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000b','member'),
    ('c0bb0000-0000-4000-8000-000000000003','c0aa0000-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000d','member'),
    ('c0bb0000-0000-4000-8000-000000000004','c0aa0000-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000e','member'),
    ('c0bb0000-0000-4000-8000-000000000011','c0aa0000-0000-4000-8000-000000000002','11111111-1111-4111-8111-00000000000e','member')
  on conflict (community_id, buyer_id) do nothing;

  insert into public.community_posts (id, community_id, author_id, kind, body, pinned, created_at) values
    ('c0cc0000-0000-4000-8000-000000000001','c0aa0000-0000-4000-8000-000000000001','11111111-1111-4111-8111-000000000001','text',
     'Glaze week. I''m testing three ash ratios and posting the breaks here first — community gets pick of the batch before anything lists.',
     true, now() - interval '2 days'),
    ('c0cc0000-0000-4000-8000-000000000002','c0aa0000-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000d','text',
     'Visited the barn studio Saturday — if she opens another kiln-day slot, take it. Watching the opening is something else.',
     false, now() - interval '5 days')
  on conflict (id) do update set body = excluded.body, pinned = excluded.pinned;

  -- Single-level only: these are comments on posts, and there is no way to
  -- comment on a comment — `post_comments` has no parent column.
  insert into public.post_comments (id, post_id, author_id, body, created_at) values
    ('c0dd0000-0000-4000-8000-000000000001','c0cc0000-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000a','The middle ratio from last time is still my favourite mug.', now() - interval '1 day'),
    ('c0dd0000-0000-4000-8000-000000000002','c0cc0000-0000-4000-8000-000000000001','11111111-1111-4111-8111-00000000000b','Any chance of a matte one?', now() - interval '1 day'),
    ('c0dd0000-0000-4000-8000-000000000003','c0cc0000-0000-4000-8000-000000000002','11111111-1111-4111-8111-000000000001','Next one''s in three weeks — pinning a signup soon.', now() - interval '4 days')
  on conflict (id) do update set body = excluded.body;

  raise notice 'seed: 0002 content loaded (notifications, collections, community).';
end $$;

-- ============================================================================
-- END seed.sql
-- Sanity check after running:
--   select (select count(*) from public.profiles)  as profiles,
--          (select count(*) from public.stores)    as stores,
--          (select count(*) from public.products)  as products,
--          (select count(*) from public.reviews where verified) as verified_reviews,
--          (select count(*) from public.badges where kind = 'real-maker') as real_maker_badges;
--   EXPECT: 10 | 5 | 4 | 2 | 4
-- ============================================================================
