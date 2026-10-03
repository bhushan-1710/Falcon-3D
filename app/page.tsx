/**
 * Falcon 3D Prints — Main Page
 * Scene composition: A → B → C → D → E → About → Samples → F → Footer
 * Design source: design.md §25 scene architecture
 *
 * Scene lengths (controlled by CSS custom properties):
 * A (Hero)      250vh desktop / 170vh mobile
 * C (Wall)      400vh desktop / 260vh mobile
 * D (Transform) 450vh desktop / 250vh mobile
 * E (Process)   350vh desktop / 220vh mobile
 * F (CTA)       scroll-resolved, ~160vh
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { Navigation } from '@/components/Navigation'
import { SceneHero } from '@/scenes/a-hero'
import { ScenePrintLab } from '@/scenes/b-print-lab'
import { SceneWorkshopWall } from '@/scenes/c-workshop-wall'
import { SceneTransform } from '@/scenes/d-transform'
import { SceneProcess } from '@/scenes/e-process'
import { SectionAbout } from '@/components/SectionAbout'
import { PrintSampleWall } from '@/components/PrintSampleWall'
import { SceneFinalCTA } from '@/scenes/f-final-cta'
import { Footer } from '@/components/Footer'

// ─── Scene detection hook ─────────────────────────────────────────────────────
const SCENE_IDS = ['hero', 'lab', 'wall', 'transform', 'process', 'about', 'samples', 'contact'] as const
type SceneId = typeof SCENE_IDS[number]

function useActiveScene(): SceneId {
  const [activeScene, setActiveScene] = useState<SceneId>('hero')

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    SCENE_IDS.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveScene(id)
            }
          })
        },
        { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
      )

      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [])

  return activeScene
}

// ─── Mobile sticky bar ────────────────────────────────────────────────────────
function MobileStickyBar({ activeScene }: { activeScene: SceneId }) {
  // Hide in CTA scene (design.md §20: "hidden in the CTA scene")
  const hide = activeScene === 'contact'
  if (hide) return null

  return (
    <div className="mobile-sticky-bar" aria-hidden={hide}>
      <a
        href="#contact"
        className="btn-primary"
        style={{ flex: 1, justifyContent: 'center' }}
      >
        START A CUSTOM PRINT
      </a>
      <a
        href="https://wa.me/919850607144?text=Hi%20Falcon%203D%20Prints%2C%20I%20have%20an%20idea%E2%80%A6"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-whatsapp"
        aria-label="Chat on WhatsApp"
        style={{ width: 52, paddingInline: 0, justifyContent: 'center', flexShrink: 0 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Page() {
  const activeScene = useActiveScene()

  return (
    <>
      {/* Navigation — fixed, outside main content flow */}
      <Navigation activeScene={activeScene} />

      {/* Skip link destination */}
      <main id="main-content" tabIndex={-1}>
        {/*
         * Scene composition:
         * A (Hero) — IDEA introduced
         * B (Print Lab) — curiosity / what we make
         * C (Workshop Wall) — proof / real work
         * D (Transform) — memory / digital→physical
         * E (Process) — understanding / from idea to object
         * About — trust / who Falcon is
         * Samples — trust / what we print
         * F (Final CTA) — action / start a print
         */}

        {/* Scene A: Hero — pinned 250vh */}
        <SceneHero />

        {/* Scene B: Print Lab — sticky state machine */}
        <ScenePrintLab />

        {/* Scene C: Workshop Wall — pinned 400vh */}
        <SceneWorkshopWall />

        {/* Scene D: Digital → Physical — pinned 450vh */}
        <SceneTransform />

        {/* Scene E: Process — pinned 350vh */}
        <SceneProcess />

        {/* About — viewport reveal */}
        <SectionAbout />

        {/* Print Sample Wall — drag interaction */}
        <PrintSampleWall />

        {/* Scene F: Final CTA — scroll resolved */}
        <SceneFinalCTA />
      </main>

      {/* Footer — follows Scene F */}
      <Footer />

      {/* Mobile sticky bar — design §20 */}
      <MobileStickyBar activeScene={activeScene} />
    </>
  )
}
