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

import {
  prepareDepthProjection,
  sampleTrackInto,
  depthPerspective,
  depthPlaneUnit,
  type DepthClock,
  type DepthLayoutOptions,
  type DepthTrack,
  type DepthViewport,
} from './depth-model';

const baseSize = 150;
type ImageState = { width: number; height: number; opacity?: number; transform?: string };
const imageStates = new WeakMap<HTMLImageElement, ImageState>();

/** Base geometry changes only when a decoded image's intrinsic dimensions change. */
export function prepareDepthImage(image: HTMLImageElement) {
  if (!image.naturalWidth || !image.naturalHeight) return;
  const aspect = image.naturalWidth / image.naturalHeight;
  const width = baseSize * Math.min(1, aspect);
  const height = baseSize / Math.max(1, aspect);
  const previous = imageStates.get(image);
  if (previous?.width === width && previous.height === height) return;
  image.style.setProperty('--depth-image-width', `${width}px`);
  image.style.setProperty('--depth-image-height', `${height}px`);
  if (previous) {
    previous.width = width;
    previous.height = height;
  } else imageStates.set(image, { width, height });
}

/** DOM/CSS renderer, independent of React and of the motion clock. */
export function renderDepthFrame(
  images: readonly (HTMLImageElement | null)[],
  tracks: readonly DepthTrack[],
  clock: DepthClock,
  viewport: DepthViewport,
  options: DepthLayoutOptions,
) {
  const projection = prepareDepthProjection(clock, viewport, options);
  const { originX, originY } = projection;
  const frame = { left: 0, top: 0, size: 0, opacity: 0, distance: 0 };
  for (let index = 0; index < tracks.length; index++) {
    const image = images[index];
    if (!image) continue;
    let geometry = imageStates.get(image);
    if (!geometry) {
      geometry = { width: 0, height: 0 };
      imageStates.set(image, geometry);
    }
    if (!geometry.width || !geometry.height) {
      if (geometry.opacity !== 0) {
        image.style.opacity = '0';
        geometry.opacity = 0;
      }
      continue;
    }
    sampleTrackInto(tracks[index], projection, frame);
    const projectedScale = frame.size / baseSize;
    const width = geometry.width * projectedScale;
    const height = geometry.height * projectedScale;
    const left = frame.left + (frame.size - width) / 2;
    const top = frame.top + (frame.size - height) / 2;
    const visible =
      frame.opacity > 0.002 &&
      left + width > 0 &&
      left < viewport.width &&
      top + height > 0 &&
      top < viewport.height;
    const opacity = visible ? frame.opacity : 0;
    if (geometry.opacity !== opacity) {
      image.style.opacity = String(opacity);
      geometry.opacity = opacity;
    }
    if (!visible) continue;
    // CSS perspective performs projection and depth sorting. Compensate its
    // scale here so the screen position and size match the established scene.
    const inverseProjection = (frame.distance * depthPlaneUnit) / depthPerspective;
    const x = originX + (left - originX) * inverseProjection;
    const y = originY + (top - originY) * inverseProjection;
    const z = depthPerspective - frame.distance * depthPlaneUnit;
    const scale = projectedScale * inverseProjection;
    const transform = `translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`;
    if (geometry.transform !== transform) {
      image.style.transform = transform;
      geometry.transform = transform;
    }
  }
}
