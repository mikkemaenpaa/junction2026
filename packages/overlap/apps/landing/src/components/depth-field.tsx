/*!
ReactDrops Component License 1.0

Copyright (c) 2026 ReactDrops

1. Scope and definitions

This license applies to ReactDrops software and associated documentation that
expressly carry this license or are distributed under a LICENSE file containing
it (the "Software"). "Licensor" means the copyright holder granting rights in
the Software, and only to the extent that holder has authority to grant them.
"You" means the individual or entity exercising these rights.

An "End Product" is a website, application, service, or other finished project
whose primary purpose is something other than providing reusable components,
source code, templates, or development assets to others.

2. Permitted uses

Subject to this license, Licensor grants You a worldwide, non-exclusive,
royalty-free license to use, copy, modify, and incorporate the Software into
unlimited personal, internal, and commercial End Products. You may charge for
End Products, subscriptions, development services, and work for clients.

You may distribute the Software as an integrated part of an End Product,
including in browser-delivered JavaScript. You may provide End Product source
code to a client, and share the Software with employees and contractors who
need it to develop or maintain End Products. Those recipients may use the
Software for those purposes subject to this license. This permission does not
authorize them to redistribute the Software as a reusable development asset.

3. Restricted redistribution

Unless You obtain separate written permission from Licensor, You may not sell,
sublicense, publish, share, or otherwise redistribute the Software, or a
substantial portion of it, whether unchanged or modified:

(a) as a standalone component, component library, UI kit, source-code bundle,
    registry, or other collection of reusable development assets;
(b) as part of a theme, template, starter project, or similar product offered
    to multiple recipients for reuse in their own projects; or
(c) through a builder or generation service that offers the Software as
    reusable blocks or source-code exports for others' projects.

These restrictions apply to paid and free redistribution. Renaming, restyling,
repackaging, translating, or modifying the Software does not remove them.
Building separate finished websites or applications for multiple clients is
permitted; offering a reusable template or kit containing the Software is not.

Public source-code hosting by Licensor is not permission to republish the
Software under another license. This license does not override any separate
rights granted directly by Licensor or applicable code-hosting terms.

4. Notices and ownership

Retain this license and applicable copyright and third-party notices in source
copies of the Software and permitted source distributions. No visible credit
or ReactDrops logo is required in an End Product's user interface.

Licensor retains ownership of its Software. You retain rights in Your own
contributions, subject to the license for any incorporated Software. No rights
to trademarks, trade names, or logos are granted by this license.

5. Third-party materials and separate grants

Dependencies, fonts, images, videos, and other third-party materials remain
subject to their respective licenses. Separately identified third-party code
is licensed under its stated terms, and these restrictions do not limit rights
granted by its copyright holders. Retain all required third-party notices.
Demo media are not licensed by this document; obtain Your own permission or
replace them with media You are entitled to use.

This license does not revoke rights granted under other valid licenses. It does
not assert ownership of third-party work or grant rights Licensor lacks.

6. Termination

The permissions granted here continue unless terminated for a material breach.
If You fail to cure a material breach within 30 days after receiving written
notice from Licensor, Your permissions terminate. On termination, cease uses
and distributions requiring this license. Rights under independently granted
licenses and rights that applicable law does not allow to be restricted remain
unaffected. Sections 3 through 7 survive termination.

7. Disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. TO THE MAXIMUM EXTENT
PERMITTED BY APPLICABLE LAW, LICENSOR AND CONTRIBUTORS SHALL NOT BE LIABLE FOR
ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN CONTRACT, TORT, OR OTHERWISE,
ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR ITS USE.

This license does not limit rights or exceptions that applicable law makes
non-waivable. No other permissions are granted by implication.
*/

'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  clamp,
  createTracks,
  entryTravel,
  entryRotationTravel,
  smoothScrollTravel,
  depthOrigins,
  depthPerspective,
  type DepthFieldOrigin,
  type DepthFieldRotationDirection,
} from './depth-model';
import { prepareDepthImage, renderDepthFrame } from './depth-renderer';
import './depth-field.css';
export type { DepthFieldOrigin, DepthFieldRotationDirection } from './depth-model';

export type DepthFieldProps = {
  images: readonly string[];
  title?: string;
  subtitle?: string;
  showText?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  imageOrigin?: DepthFieldOrigin;
  buttonText?: string;
  buttonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  fontFamily?: string;
  speed?: number;
  entryDuration?: number;
  entryDelay?: number;
  entryBurst?: number;
  scrollBoost?: number;
  rotationSpeed?: number;
  rotationDirection?: DepthFieldRotationDirection;
  imageSize?: number;
  imageRadius?: number;
  spread?: number;
  depth?: number;
  count?: number;
  paused?: boolean;
  background?: string;
  color?: string;
  fontSize?: string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
};
export type DepthFieldHandle = { replay: () => void };

/** A continuously rotating depth cloud rendered with DOM images and CSS transforms. */
export const DepthField = forwardRef<DepthFieldHandle, DepthFieldProps>(function DepthField(
  {
    images,
    title = 'Follow your\ncuriosity.',
    subtitle = '',
    buttonText = 'Explore components',
    buttonHref = '/components',
    secondaryButtonText = 'Learn more',
    secondaryButtonHref = '#controls',
    showText = true,
    textAlign = 'center',
    imageOrigin = 'center',
    fontFamily = "'Plus Jakarta Sans', 'Inter Variable', sans-serif",
    speed = 5,
    entryDuration = 2.8,
    entryDelay = 0,
    entryBurst = 70,
    scrollBoost = 50,
    rotationSpeed = 11,
    rotationDirection = 'counterclockwise',
    imageSize = 3.8,
    imageRadius = 0,
    spread = 12,
    depth = 96,
    count = 36,
    paused = false,
    background = '#ffffff',
    color = '#242120',
    fontSize = 'clamp(2rem, 5.5cqw, 5rem)',
    height = 600,
    className = '',
    style,
  },
  forwardedRef,
) {
  const root = useRef<HTMLElement>(null);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const [replay, setReplay] = useState(0);
  const [readyKey, setReadyKey] = useState('');
  useImperativeHandle(forwardedRef, () => ({ replay: () => setReplay((value) => value + 1) }), []);
  const urls = images.map((url) => url.trim()).filter(Boolean);
  const imageKey = JSON.stringify(urls);
  const planeCount = urls.length ? Math.round(clamp(count, 6, 80)) : 0;
  const sceneKey = JSON.stringify([imageKey, planeCount, depth, spread, replay]);
  const ready = !planeCount || readyKey === sceneKey;
  const options = useRef({
    speed,
    entryDuration,
    entryDelay,
    entryBurst,
    scrollBoost,
    rotationSpeed,
    rotationDirection,
    imageSize,
    imageOrigin,
    paused,
  });
  options.current = {
    speed,
    entryDuration,
    entryDelay,
    entryBurst,
    scrollBoost,
    rotationSpeed,
    rotationDirection,
    imageSize,
    imageOrigin,
    paused,
  };
  const wake = useRef<() => void>(() => {});
  useEffect(() => {
    wake.current();
  }, [
    speed,
    entryDuration,
    entryDelay,
    entryBurst,
    scrollBoost,
    rotationSpeed,
    rotationDirection,
    imageSize,
    imageOrigin,
    paused,
  ]);

  useEffect(() => {
    const element = root.current;
    if (!element || !planeCount) return;
    setReadyKey('');
    const far = clamp(depth, 20, 160);
    const tracks = createTracks(planeCount, clamp(spread, 2, 20), far);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const images = imageRefs.current.slice(0, planeCount);
    const pendingImages = new Set(images.filter((image): image is HTMLImageElement => !!image));
    const decodingImages = new Set<HTMLImageElement>();
    let disposed = false,
      sceneReady = false;
    let viewport = { width: element.clientWidth, height: element.clientHeight };
    let elapsed = 0,
      waited = 0,
      travel = 0,
      rotation = 0,
      scrollImpulse = 0,
      scrollVelocity = 0;
    // Scroll events only invalidate a source. Read its position once before
    // the next frame's writes, without walking styles or measuring rectangles.
    const scrollPositions = new Map<Element, number>();
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      scrollPositions.set(parent, parent.scrollTop);
    }
    if (document.scrollingElement) {
      scrollPositions.set(document.scrollingElement, document.scrollingElement.scrollTop);
    }
    const pendingScroll = new Set<Element>();
    let frame = 0,
      last = 0,
      visible = false;
    let skipEntrance =
      reduced.matches || options.current.paused || options.current.entryDuration <= 0;
    const clock = { travel, rotation };
    const layout = {
      depth: far,
      imageSize: options.current.imageSize,
      origin: options.current.imageOrigin,
      emptyStart: !skipEntrance,
    };
    const paint = () => {
      if (!sceneReady) return;
      clock.travel = travel;
      clock.rotation = rotation;
      layout.imageSize = options.current.imageSize;
      layout.origin = options.current.imageOrigin;
      layout.emptyStart = !skipEntrance && travel < far + 7;
      renderDepthFrame(images, tracks, clock, viewport, layout);
    };
    const active = () =>
      sceneReady && visible && !document.hidden && !reduced.matches && !options.current.paused;
    const canMove = () =>
      active() &&
      (elapsed < clamp(options.current.entryDuration, 0, 4) ||
        options.current.speed > 0 ||
        options.current.rotationSpeed > 0 ||
        (scrollImpulse + scrollVelocity) * options.current.scrollBoost > 0.001 ||
        (pendingScroll.size > 0 && options.current.scrollBoost > 0));
    const readScroll = () => {
      let movement = 0;
      for (const source of pendingScroll) {
        const previous = scrollPositions.get(source) ?? source.scrollTop;
        const position = source.scrollTop;
        movement += Math.abs(position - previous);
        scrollPositions.set(source, position);
      }
      pendingScroll.clear();
      scrollImpulse = clamp(scrollImpulse + (movement / Math.max(1, viewport.height)) * 2, 0, 1);
    };
    const tick = (stamp: number) => {
      frame = 0;
      if (!canMove()) {
        last = 0;
        return;
      }
      let frameTime = last ? (stamp - last) / 1000 : 0;
      last = stamp;
      readScroll();
      const o = options.current;
      // The entry delay holds both clocks at zero, so the field stays empty
      // behind the visible copy. It follows real time while active, even at
      // low frame rates; scroll during the wait is discarded. Once the
      // entrance runs, the delay is over.
      if (!elapsed && !skipEntrance) {
        const remaining = Math.max(0, clamp(o.entryDelay, 0, 10) - waited);
        const wait = Math.min(frameTime, remaining);
        waited += wait;
        frameTime -= wait;
        if (remaining > wait) {
          scrollImpulse = 0;
          scrollVelocity = 0;
          frame = requestAnimationFrame(tick);
          return;
        }
      }
      // Motion steps stay capped so a stalled frame cannot jump the scene.
      const dt = Math.min(frameTime, 0.05);
      const previous = elapsed;
      elapsed += dt;
      const speed = clamp(o.speed, 0, 60),
        burst = clamp(o.entryBurst, 0, 500);
      const entry = skipEntrance ? 0 : clamp(o.entryDuration, 0, 4);
      const scroll = smoothScrollTravel(scrollImpulse, scrollVelocity, dt);
      scrollImpulse = scroll.remaining;
      scrollVelocity = scroll.velocity;
      travel +=
        entryTravel(elapsed, entry, speed, burst) -
        entryTravel(previous, entry, speed, burst) +
        scroll.travel * clamp(o.scrollBoost, 0, 100);
      const orbitTime =
        entryRotationTravel(elapsed, entry, speed, burst) -
        entryRotationTravel(previous, entry, speed, burst);
      rotation +=
        orbitTime * clamp(o.rotationSpeed, 0, 120) * (o.rotationDirection === 'clockwise' ? -1 : 1);
      paint();
      frame = requestAnimationFrame(tick);
    };
    const schedule = () => {
      if (!canMove()) {
        cancelAnimationFrame(frame);
        frame = 0;
        last = 0;
      } else if (!frame) frame = requestAnimationFrame(tick);
    };
    const resume = () => {
      // The copy is already visible. Image clocks stay at zero while loading,
      // decoding, waiting for layout or initially offscreen.
      if (
        !sceneReady &&
        !pendingImages.size &&
        viewport.width > 0 &&
        viewport.height > 0 &&
        visible &&
        !document.hidden
      ) {
        sceneReady = true;
        setReadyKey(sceneKey);
      }
      if (options.current.scrollBoost <= 0) {
        scrollImpulse = 0;
        scrollVelocity = 0;
      }
      if (!active() || options.current.scrollBoost <= 0) {
        pendingScroll.clear();
        for (const source of scrollPositions.keys()) scrollPositions.set(source, source.scrollTop);
      }
      schedule();
      paint();
    };
    wake.current = resume;
    const captureScroll = (event: Event) => {
      const target = event.target === document ? document.scrollingElement : event.target;
      if (!target || !scrollPositions.has(target as Element)) return;
      const source = target as Element;
      if (!active() || options.current.scrollBoost <= 0) {
        scrollPositions.set(source, source.scrollTop);
        return;
      }
      pendingScroll.add(source);
      schedule();
    };
    const resize = new ResizeObserver(() => {
      viewport = { width: element.clientWidth, height: element.clientHeight };
      resume();
    });
    resize.observe(element);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    observer.observe(element);
    const changeMotion = () => {
      if (reduced.matches) {
        skipEntrance = true;
        travel = 0;
        rotation = 0;
        scrollImpulse = 0;
        scrollVelocity = 0;
      }
      resume();
    };
    const settleImage = (image: HTMLImageElement, decoded: boolean) => {
      if (disposed || !pendingImages.delete(image)) return;
      if (decoded) prepareDepthImage(image);
      decodingImages.delete(image);
      resume();
    };
    const decodeImage = (image: HTMLImageElement) => {
      if (disposed || !pendingImages.has(image) || decodingImages.has(image)) return;
      if (!image.naturalWidth || !image.naturalHeight) {
        settleImage(image, false);
        return;
      }
      if (typeof image.decode !== 'function') {
        settleImage(image, true);
        return;
      }
      decodingImages.add(image);
      try {
        void image.decode().then(
          () => settleImage(image, true),
          () => settleImage(image, false),
        );
      } catch {
        settleImage(image, false);
      }
    };
    const loadImage = (event: Event) => decodeImage(event.currentTarget as HTMLImageElement);
    const failImage = (event: Event) => settleImage(event.currentTarget as HTMLImageElement, false);
    images.forEach((image) => {
      if (!image) return;
      image.addEventListener('load', loadImage);
      image.addEventListener('error', failImage);
      // Cached loads can finish before the effect attaches its listeners.
      if (image.complete) decodeImage(image);
    });
    document.addEventListener('visibilitychange', resume);
    document.addEventListener('scroll', captureScroll, { capture: true, passive: true });
    reduced.addEventListener('change', changeMotion);
    resume();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      wake.current = () => {};
      resize.disconnect();
      observer.disconnect();
      images.forEach((image) => {
        image?.removeEventListener('load', loadImage);
        image?.removeEventListener('error', failImage);
      });
      pendingImages.clear();
      decodingImages.clear();
      document.removeEventListener('visibilitychange', resume);
      document.removeEventListener('scroll', captureScroll, true);
      reduced.removeEventListener('change', changeMotion);
    };
  }, [imageKey, planeCount, depth, spread, replay, sceneKey]);

  return (
    <section
      ref={root}
      className={`depth-field ${className}`}
      data-text-align={textAlign}
      data-ready={ready}
      style={{ height, background, color, ...style }}
    >
      {showText && (
        <div className="depth-field-copy">
          <h2 style={{ fontSize, fontFamily }}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
          {(buttonText || secondaryButtonText) && (
            <div className="depth-field-actions">
              {buttonText && (
                <a className="depth-field-button" href={buttonHref}>
                  {buttonText}
                </a>
              )}
              {secondaryButtonText && (
                <a
                  className="depth-field-button depth-field-button-secondary"
                  href={secondaryButtonHref}
                >
                  {secondaryButtonText}
                </a>
              )}
            </div>
          )}
        </div>
      )}
      <div
        className="depth-field-field"
        aria-hidden="true"
        aria-busy={!ready}
        style={
          {
            '--depth-perspective': `${depthPerspective}px`,
            perspectiveOrigin: `${depthOrigins[imageOrigin][0] * 100}% ${depthOrigins[imageOrigin][1] * 100}%`,
          } as CSSProperties
        }
      >
        {Array.from({ length: planeCount }, (_, index) => (
          <img
            key={`${imageKey}-${index}`}
            ref={(node) => {
              imageRefs.current[index] = node;
            }}
            src={urls[index % urls.length]}
            alt=""
            decoding="async"
            fetchPriority="low"
            draggable={false}
            className="depth-field-image"
            style={{ borderRadius: clamp(imageRadius, 0, 120) }}
          />
        ))}
      </div>
    </section>
  );
});
