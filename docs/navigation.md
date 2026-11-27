# Navigation menus in Nuxt UI

Native generated navigation-menu theme with Reka NavigationMenu for horizontal navigation, Accordion for vertical in-flow branches, DropdownMenu for recursive flyouts. The high-level navigation component does not directly express the required three-level recursive popup contract, so the adapter composes its native primitives and theme. Native menu icons are bundled through the existing icon integration.

All four UiNavMenu presentations are implemented: horizontal, vertical-tree, vertical-popup, and icon-popup. The shared controller owns current/path/requests, while each view owns expansion. Current changes reveal persistent ancestry without opening closed flyouts. Native markup, focus mechanics and styling remain backend-owned. Group and descendant slots preserve leading icons; check selection and shortcut hints are absent from navigation projections.

With `width` omitted, `horizontal` and `vertical-tree` roots fill the
parent's offered width. `vertical-popup` and `icon-popup` roots size to their
content up to that width.
Use `width="full"` or `width="content"` to select the root width explicitly
(`navigation.menu.width.v1`). Floating submenus size independently.

Icon-popup uses labelled flyouts and accessible root names; missing root destination icons receive neutral menu-item artwork without changing modes. Navigation labels are required. Responsive selection is application-owned; UiNavbar does not automatically collapse.

The existing application-owned theme/configuration and stylesheet ordering continue to apply; there are no new business-side spacing, caret or native-widget props. See this backend's customization guide for toolkit settings actually consumed by the adapter.

Focused shared DOM tests cover the four presentations, three levels, icons, command-metadata isolation, current/breadcrumb synchronization, synchronous link interception, single request dispatch and accepted/refused navigation. DOM checks do not establish browser geometry, animation, mobile/RTL placement or assistive-technology acceptance.

Popup regression coverage also mounts the full travel example in Vue development mode with sibling submenus and Presence exit-animation lifecycle. Toggle/outside/Escape dismissal and pointer/keyboard activation must complete without warnings or recursive updates. Core ignores unchanged expansion reports from native submenu cleanup; native animations remain enabled.

Horizontal flyouts share Reka NavigationMenu’s native hover timer across teleported submenu surfaces. Entering a descendant cancels the parent’s pending dismissal; leaving the descendant starts the same native close delay. Native submenu pointer grace, focus and outside/Escape dismissal remain in place. The full-example DOM regression covers hover entry, return to the parent, descendant focus/activation and leaving the popup tree. The browser scenario additionally crosses the actual popup geometry in both directions.

Vertical roots and all persistent tree levels retain a leading icon column, including empty decorative slots. This keeps hierarchy independent of icon presence and supports consistent icon coordinates across vertical modes. Independent floating surfaces retain per-level icon-presence decisions. Rail labels appear on hover/focus; grouped headings retain hidden accessible text without widening the rail. Fallback artwork is a view projection, never a source mutation.

Drawer-based navigation is not a UiNavMenu presentation. Support for a hamburger trigger, drawer container and vertical hierarchy composition is planned; its public API and coordination solution remain undetermined.

Root navigation renders a logical themed separator unless an eligible UiNavbar or explicitly designated UiRegionLayout navigation region owns the adjoining boundary. The backend surface coordinates allocation transitions, focus and rail hints through useUiNavigationPresentation; it retains native row/icon geometry. Reduced motion suppresses transitions. DOM regressions cover ownership, fallbacks, expansion retention and hints. Compare geometry, focus and reduced-motion behavior in a browser.
